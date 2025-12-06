import { Express } from "express";
import { storage } from "../storage.js";

export function registerReportRoutes(app: Express) {
  // Dashboard statistics - overview of all key metrics
  app.get("/api/reports/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const [
        users,
        apartments,
        bookings,
        complaints,
        visitors,
        notices,
      ] = await Promise.all([
        storage.getAllUsers(),
        storage.getApartments(),
        storage.getAllBookings(),
        storage.getAllComplaints(),
        storage.getAllVisitors(),
        storage.getActiveNotices(),
      ]);

      // Calculate stats
      const totalResidents = users.filter(u => u.role === 'resident').length;
      const totalGuards = users.filter(u => u.role === 'guard').length;
      const usersWithApartment = users.filter(u => u.apartmentId).length;

      const occupiedApartments = apartments.filter(a => a.status === 'OCCUPIED').length;
      const forRentApartments = apartments.filter(a => a.status === 'AVAILABLE_RENT').length;
      const forSaleApartments = apartments.filter(a => a.status === 'AVAILABLE_SALE').length;
      const occupancyRate = apartments.length > 0
        ? Math.round((occupiedApartments / apartments.length) * 100)
        : 0;

      const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
      const approvedBookings = bookings.filter(b => b.status === 'APPROVED').length;
      const rejectedBookings = bookings.filter(b => b.status === 'REJECTED').length;

      const openComplaints = complaints.filter(c => c.status === 'open').length;
      const inProgressComplaints = complaints.filter(c => c.status === 'in_progress').length;
      const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;

      // Today's visitors
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const visitorsToday = visitors.filter(v => new Date(v.entryTime) >= today).length;
      const visitorsInside = visitors.filter(v => v.status === 'inside').length;

      // This week's visitors
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const visitorsThisWeek = visitors.filter(v => new Date(v.entryTime) >= weekAgo).length;

      // This month's visitors
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const visitorsThisMonth = visitors.filter(v => new Date(v.entryTime) >= monthAgo).length;

      res.json({
        users: {
          total: users.length,
          residents: totalResidents,
          guards: totalGuards,
          admins: users.filter(u => u.role === 'admin').length,
          withApartment: usersWithApartment,
          withoutApartment: users.length - usersWithApartment,
        },
        apartments: {
          total: apartments.length,
          occupied: occupiedApartments,
          forRent: forRentApartments,
          forSale: forSaleApartments,
          occupancyRate,
        },
        bookings: {
          total: bookings.length,
          pending: pendingBookings,
          approved: approvedBookings,
          rejected: rejectedBookings,
        },
        complaints: {
          total: complaints.length,
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
        },
        visitors: {
          total: visitors.length,
          today: visitorsToday,
          thisWeek: visitorsThisWeek,
          thisMonth: visitorsThisMonth,
          currentlyInside: visitorsInside,
        },
        notices: {
          active: notices.length,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Visitor reports with charts data
  app.get("/api/reports/visitors", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const visitors = await storage.getAllVisitors();
      const apartments = await storage.getApartments();
      const towers = await storage.getTowers();

      // Create tower lookup
      const towerMap = new Map(towers.map(t => [t.id, t.name]));
      const apartmentMap = new Map(apartments.map(a => [a.id, { ...a, towerName: towerMap.get(a.towerId) }]));

      // Visitors by purpose
      const byPurpose: Record<string, number> = {};
      visitors.forEach(v => {
        byPurpose[v.purpose] = (byPurpose[v.purpose] || 0) + 1;
      });

      // Visitors by tower
      const byTower: Record<string, number> = {};
      visitors.forEach(v => {
        const apt = apartmentMap.get(v.apartmentId);
        const towerName = apt?.towerName || 'Unknown';
        byTower[towerName] = (byTower[towerName] || 0) + 1;
      });

      // Visitors by hour (for peak hours chart)
      const byHour: Record<number, number> = {};
      visitors.forEach(v => {
        const hour = new Date(v.entryTime).getHours();
        byHour[hour] = (byHour[hour] || 0) + 1;
      });

      // Visitors by day of week
      const byDayOfWeek: Record<string, number> = {
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
        'Thursday': 0, 'Friday': 0, 'Saturday': 0
      };
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      visitors.forEach(v => {
        const day = days[new Date(v.entryTime).getDay()];
        byDayOfWeek[day] = (byDayOfWeek[day] || 0) + 1;
      });

      // Visitors trend (last 30 days)
      const last30Days: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const count = visitors.filter(v => {
          const entryDate = new Date(v.entryTime);
          return entryDate >= date && entryDate < nextDay;
        }).length;

        last30Days.push({
          date: date.toISOString().split('T')[0],
          count,
        });
      }

      // Average visit duration (for checked out visitors)
      const checkedOutVisitors = visitors.filter(v => v.exitTime);
      let avgDurationMinutes = 0;
      if (checkedOutVisitors.length > 0) {
        const totalMinutes = checkedOutVisitors.reduce((sum, v) => {
          const entry = new Date(v.entryTime).getTime();
          const exit = new Date(v.exitTime!).getTime();
          return sum + (exit - entry) / (1000 * 60);
        }, 0);
        avgDurationMinutes = Math.round(totalMinutes / checkedOutVisitors.length);
      }

      res.json({
        total: visitors.length,
        checkedOut: checkedOutVisitors.length,
        currentlyInside: visitors.filter(v => v.status === 'inside').length,
        avgDurationMinutes,
        byPurpose: Object.entries(byPurpose).map(([name, value]) => ({ name, value })),
        byTower: Object.entries(byTower).map(([name, value]) => ({ name, value })),
        byHour: Object.entries(byHour).map(([hour, count]) => ({ hour: parseInt(hour), count })).sort((a, b) => a.hour - b.hour),
        byDayOfWeek: Object.entries(byDayOfWeek).map(([day, count]) => ({ day, count })),
        trend: last30Days,
      });
    } catch (error) {
      console.error("Error fetching visitor reports:", error);
      res.status(500).json({ error: "Failed to fetch visitor reports" });
    }
  });

  // Booking reports with charts data
  app.get("/api/reports/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const bookings = await storage.getAllBookings();
      const amenities = await storage.getAmenities();

      // Create amenity lookup
      const amenityMap = new Map(amenities.map(a => [a.id, a.name]));

      // Bookings by amenity
      const byAmenity: Record<string, number> = {};
      bookings.forEach(b => {
        const name = amenityMap.get(b.amenityId) || 'Unknown';
        byAmenity[name] = (byAmenity[name] || 0) + 1;
      });

      // Bookings by status
      const byStatus: Record<string, number> = {
        'PENDING': 0,
        'APPROVED': 0,
        'REJECTED': 0,
      };
      bookings.forEach(b => {
        byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      });

      // Approval rate
      const totalDecided = byStatus['APPROVED'] + byStatus['REJECTED'];
      const approvalRate = totalDecided > 0
        ? Math.round((byStatus['APPROVED'] / totalDecided) * 100)
        : 0;

      // Bookings by month (last 6 months)
      const byMonth: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const count = bookings.filter(b => {
          const bookingDate = new Date(b.startTime);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        }).length;

        byMonth.push({ month: monthName, count });
      }

      // Popular amenities (top 5)
      const popularAmenities = Object.entries(byAmenity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      res.json({
        total: bookings.length,
        pending: byStatus['PENDING'],
        approved: byStatus['APPROVED'],
        rejected: byStatus['REJECTED'],
        approvalRate,
        byAmenity: Object.entries(byAmenity).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        byMonth,
        popularAmenities,
      });
    } catch (error) {
      console.error("Error fetching booking reports:", error);
      res.status(500).json({ error: "Failed to fetch booking reports" });
    }
  });

  // Complaint reports with charts data
  app.get("/api/reports/complaints", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const complaints = await storage.getAllComplaints();

      // By category
      const byCategory: Record<string, number> = {};
      complaints.forEach(c => {
        byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      });

      // By status
      const byStatus: Record<string, number> = {
        'open': 0,
        'in_progress': 0,
        'resolved': 0,
        'closed': 0,
        'rejected': 0,
      };
      complaints.forEach(c => {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      });

      // By priority
      const byPriority: Record<string, number> = {
        'low': 0,
        'medium': 0,
        'high': 0,
        'urgent': 0,
      };
      complaints.forEach(c => {
        byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
      });

      // Resolution rate
      const totalResolvable = complaints.length - byStatus['rejected'];
      const resolved = byStatus['resolved'] + byStatus['closed'];
      const resolutionRate = totalResolvable > 0
        ? Math.round((resolved / totalResolvable) * 100)
        : 0;

      // Average resolution time (for resolved complaints)
      const resolvedComplaints = complaints.filter(c => c.resolvedAt);
      let avgResolutionHours = 0;
      if (resolvedComplaints.length > 0) {
        const totalHours = resolvedComplaints.reduce((sum, c) => {
          const created = new Date(c.createdAt).getTime();
          const resolved = new Date(c.resolvedAt!).getTime();
          return sum + (resolved - created) / (1000 * 60 * 60);
        }, 0);
        avgResolutionHours = Math.round(totalHours / resolvedComplaints.length);
      }

      // Complaints trend (last 30 days)
      const last30Days: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const count = complaints.filter(c => {
          const createdDate = new Date(c.createdAt);
          return createdDate >= date && createdDate < nextDay;
        }).length;

        last30Days.push({
          date: date.toISOString().split('T')[0],
          count,
        });
      }

      // Pending complaints aging (how long they've been open)
      const openComplaints = complaints.filter(c => c.status === 'open' || c.status === 'in_progress');
      const aging = {
        lessThan24h: 0,
        oneToThreeDays: 0,
        threeToSevenDays: 0,
        moreThanWeek: 0,
      };
      const now = Date.now();
      openComplaints.forEach(c => {
        const hoursOpen = (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursOpen < 24) aging.lessThan24h++;
        else if (hoursOpen < 72) aging.oneToThreeDays++;
        else if (hoursOpen < 168) aging.threeToSevenDays++;
        else aging.moreThanWeek++;
      });

      res.json({
        total: complaints.length,
        open: byStatus['open'],
        inProgress: byStatus['in_progress'],
        resolved: byStatus['resolved'] + byStatus['closed'],
        rejected: byStatus['rejected'],
        resolutionRate,
        avgResolutionHours,
        byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        byPriority: Object.entries(byPriority).map(([name, value]) => ({ name, value })),
        trend: last30Days,
        aging,
      });
    } catch (error) {
      console.error("Error fetching complaint reports:", error);
      res.status(500).json({ error: "Failed to fetch complaint reports" });
    }
  });

  // Occupancy reports
  app.get("/api/reports/occupancy", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    try {
      const apartments = await storage.getApartments();
      const towers = await storage.getTowers();
      const users = await storage.getAllUsers();

      // Create tower lookup
      const towerMap = new Map(towers.map(t => [t.id, t.name]));

      // By status
      const byStatus: Record<string, number> = {
        'OCCUPIED': 0,
        'AVAILABLE_RENT': 0,
        'AVAILABLE_SALE': 0,
      };
      apartments.forEach(a => {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      });

      // By tower
      const byTower: { tower: string; occupied: number; forRent: number; forSale: number; total: number }[] = [];
      towers.forEach(tower => {
        const towerApartments = apartments.filter(a => a.towerId === tower.id);
        byTower.push({
          tower: tower.name,
          occupied: towerApartments.filter(a => a.status === 'OCCUPIED').length,
          forRent: towerApartments.filter(a => a.status === 'AVAILABLE_RENT').length,
          forSale: towerApartments.filter(a => a.status === 'AVAILABLE_SALE').length,
          total: towerApartments.length,
        });
      });

      // By type (2BHK, 3BHK, etc.)
      const byType: Record<string, number> = {};
      apartments.forEach(a => {
        byType[a.type] = (byType[a.type] || 0) + 1;
      });

      // Residents per apartment
      const residentsPerApartment: Record<number, number> = {};
      users.forEach(u => {
        if (u.apartmentId) {
          residentsPerApartment[u.apartmentId] = (residentsPerApartment[u.apartmentId] || 0) + 1;
        }
      });

      // Calculate average residents per occupied apartment
      const occupiedApartmentIds = apartments.filter(a => a.status === 'OCCUPIED').map(a => a.id);
      const totalResidents = occupiedApartmentIds.reduce((sum, id) => sum + (residentsPerApartment[id] || 0), 0);
      const avgResidentsPerApartment = occupiedApartmentIds.length > 0
        ? (totalResidents / occupiedApartmentIds.length).toFixed(1)
        : '0';

      // For rent/sale listings with details
      const forRentListings = apartments
        .filter(a => a.status === 'AVAILABLE_RENT')
        .map(a => ({
          id: a.id,
          tower: towerMap.get(a.towerId),
          number: a.number,
          floor: a.floor,
          type: a.type,
          rent: a.monthlyRent,
        }));

      const forSaleListings = apartments
        .filter(a => a.status === 'AVAILABLE_SALE')
        .map(a => ({
          id: a.id,
          tower: towerMap.get(a.towerId),
          number: a.number,
          floor: a.floor,
          type: a.type,
          price: a.salePrice,
        }));

      // Occupancy rate
      const occupancyRate = apartments.length > 0
        ? Math.round((byStatus['OCCUPIED'] / apartments.length) * 100)
        : 0;

      res.json({
        total: apartments.length,
        occupied: byStatus['OCCUPIED'],
        forRent: byStatus['AVAILABLE_RENT'],
        forSale: byStatus['AVAILABLE_SALE'],
        occupancyRate,
        avgResidentsPerApartment,
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
        byTower,
        byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
        forRentListings,
        forSaleListings,
      });
    } catch (error) {
      console.error("Error fetching occupancy reports:", error);
      res.status(500).json({ error: "Failed to fetch occupancy reports" });
    }
  });

  // Export reports to CSV
  app.get("/api/reports/export/:type", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.isAdmin) return res.sendStatus(403);

    const { type } = req.params;

    try {
      let csvContent = '';
      let filename = '';

      switch (type) {
        case 'visitors': {
          const visitors = await storage.getAllVisitors();
          const apartments = await storage.getApartments();
          const towers = await storage.getTowers();

          const towerMap = new Map(towers.map(t => [t.id, t.name]));
          const apartmentMap = new Map(apartments.map(a => [a.id, { number: a.number, tower: towerMap.get(a.towerId) }]));

          csvContent = 'Name,Mobile,Purpose,Apartment,Tower,Entry Time,Exit Time,Status\n';
          visitors.forEach(v => {
            const apt = apartmentMap.get(v.apartmentId);
            csvContent += `"${v.name}","${v.mobileNumber}","${v.purpose}","${apt?.number || ''}","${apt?.tower || ''}","${v.entryTime}","${v.exitTime || ''}","${v.status}"\n`;
          });
          filename = 'visitors-report.csv';
          break;
        }

        case 'bookings': {
          const bookings = await storage.getAllBookings();
          const amenities = await storage.getAmenities();
          const users = await storage.getAllUsers();

          const amenityMap = new Map(amenities.map(a => [a.id, a.name]));
          const userMap = new Map(users.map(u => [u.id, u.name]));

          csvContent = 'User,Amenity,Start Time,End Time,Status\n';
          bookings.forEach(b => {
            csvContent += `"${userMap.get(b.userId) || ''}","${amenityMap.get(b.amenityId) || ''}","${b.startTime}","${b.endTime}","${b.status}"\n`;
          });
          filename = 'bookings-report.csv';
          break;
        }

        case 'complaints': {
          const complaints = await storage.getAllComplaints();
          const users = await storage.getAllUsers();
          const apartments = await storage.getApartments();
          const towers = await storage.getTowers();

          const userMap = new Map(users.map(u => [u.id, u.name]));
          const towerMap = new Map(towers.map(t => [t.id, t.name]));
          const apartmentMap = new Map(apartments.map(a => [a.id, { number: a.number, tower: towerMap.get(a.towerId) }]));

          csvContent = 'Title,Category,Priority,Status,Apartment,Tower,Created By,Created At,Resolved At\n';
          complaints.forEach(c => {
            const apt = apartmentMap.get(c.apartmentId);
            csvContent += `"${c.title}","${c.category}","${c.priority}","${c.status}","${apt?.number || ''}","${apt?.tower || ''}","${userMap.get(c.createdBy) || ''}","${c.createdAt}","${c.resolvedAt || ''}"\n`;
          });
          filename = 'complaints-report.csv';
          break;
        }

        case 'apartments': {
          const apartments = await storage.getApartments();
          const towers = await storage.getTowers();
          const users = await storage.getAllUsers();

          const towerMap = new Map(towers.map(t => [t.id, t.name]));

          // Count residents per apartment
          const residentsCount: Record<number, number> = {};
          users.forEach(u => {
            if (u.apartmentId) {
              residentsCount[u.apartmentId] = (residentsCount[u.apartmentId] || 0) + 1;
            }
          });

          csvContent = 'Tower,Number,Floor,Type,Status,Owner,Residents,Monthly Rent,Sale Price,Contact\n';
          apartments.forEach(a => {
            csvContent += `"${towerMap.get(a.towerId) || ''}","${a.number}","${a.floor}","${a.type}","${a.status}","${a.ownerName || ''}","${residentsCount[a.id] || 0}","${a.monthlyRent || ''}","${a.salePrice || ''}","${a.contactNumber || ''}"\n`;
          });
          filename = 'apartments-report.csv';
          break;
        }

        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ error: "Failed to export report" });
    }
  });
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@shared/schema";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Users() {
  const { toast } = useToast();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      isAdmin,
    }: {
      userId: number;
      isAdmin: boolean;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, {
        isAdmin,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAdmin = (user: User) => {
    updateUserMutation.mutate({
      userId: user.id,
      isAdmin: !user.isAdmin,
    });
  };

  return (
    <div className="container p-6">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{user.name}</span>
                  <Button
                    variant={user.isAdmin ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleAdmin(user)}
                    disabled={updateUserMutation.isPending}
                  >
                    {user.isAdmin ? (
                      <>
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Make Admin
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Username: {user.username}
                  </p>
                  {user.apartmentId && (
                    <p className="text-sm text-muted-foreground">
                      Apartment ID: {user.apartmentId}
                    </p>
                  )}
                  <p className="text-sm">
                    Role: {user.isAdmin ? "Administrator" : "Resident"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

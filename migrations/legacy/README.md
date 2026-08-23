# Legacy migrations

These SQL files were applied to the database by hand and were never recorded in
`../meta/_journal.json`, so drizzle-kit has no knowledge of them.

**They are kept for history only. Do not run them.**

`0000_nice_red_skull.sql` is a consolidated snapshot that already contains every
table these files added, and `0001_dark_katie_power.sql` adds the indexes that
were likewise created by hand. Those two files together reproduce the current
schema; replaying anything here on top would fail or duplicate objects.

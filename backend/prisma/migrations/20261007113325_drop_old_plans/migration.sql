-- The three old plans are gone from the panel for good.
--
-- Safe to remove: a consultation records its own plan name, price and
-- duration when it is booked, so finished bookings read back correctly
-- without the row. Only a live consultation looks its plan up, and none
-- were left on these.
DELETE FROM "service_plans" WHERE "code" IN ('audio', 'video', 'chat');

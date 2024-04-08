CREATE TABLE `events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`type` text,
	`room_id` text,
	`content` text,
	`origin_server_ts` integer,
	`sender` text,
	`state_key` text,
	`txn_id` text,
	`membership` text,
	`unsigned` text,
	`redacts` text
);
--> statement-breakpoint
CREATE INDEX `roomIndex` ON `events` (`room_id`,`origin_server_ts`);
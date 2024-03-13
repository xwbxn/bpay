CREATE TABLE `events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`type` text,
	`content` text,
	`sender` text,
	`room_id` text,
	`origin_server_ts` integer,
	`txn_id` text,
	`state_key` text,
	`membership` text,
	`unsigned` text,
	`redacts` text
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`roomId` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`normalizedName` text,
	`title` text,
	`tags` text
);
--> statement-breakpoint
CREATE INDEX `events_room_id_idx` ON `events` (`room_id`);--> statement-breakpoint
CREATE INDEX `events_ts` ON `events` (`origin_server_ts`);
CREATE TABLE `clinic_appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`practitionerId` text NOT NULL,
	`startsAt` text NOT NULL,
	`durationMinutes` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`patientId`) REFERENCES `clinic_patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`practitionerId`) REFERENCES `clinic_practitioners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `appointments_starts_at_idx` ON `clinic_appointments` (`startsAt`);--> statement-breakpoint
CREATE INDEX `appointments_practitioner_idx` ON `clinic_appointments` (`practitionerId`);--> statement-breakpoint
CREATE TABLE `clinic_clinical_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`practitionerId` text NOT NULL,
	`appointmentId` text,
	`note` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`patientId`) REFERENCES `clinic_patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`practitionerId`) REFERENCES `clinic_practitioners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointmentId`) REFERENCES `clinic_appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `clinical_notes_patient_idx` ON `clinic_clinical_notes` (`patientId`);--> statement-breakpoint
CREATE TABLE `clinic_patients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`birthDate` text,
	`phone` text,
	`email` text,
	`medicalAlerts` text,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clinic_practitioners` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`color` text NOT NULL
);

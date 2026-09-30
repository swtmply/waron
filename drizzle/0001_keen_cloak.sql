CREATE TABLE `clinic_installment_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`planId` text NOT NULL,
	`amountCents` integer NOT NULL,
	`paidOn` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`planId`) REFERENCES `clinic_treatment_plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `installment_payments_plan_idx` ON `clinic_installment_payments` (`planId`);--> statement-breakpoint
CREATE TABLE `clinic_treatment_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`patientId` text NOT NULL,
	`practitionerId` text NOT NULL,
	`procedure` text NOT NULL,
	`totalCents` integer NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`patientId`) REFERENCES `clinic_patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`practitionerId`) REFERENCES `clinic_practitioners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `treatment_plans_patient_idx` ON `clinic_treatment_plans` (`patientId`);--> statement-breakpoint
CREATE INDEX `treatment_plans_practitioner_idx` ON `clinic_treatment_plans` (`practitionerId`);
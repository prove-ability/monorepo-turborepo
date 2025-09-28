ALTER TABLE "classes" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "manager_id" uuid;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_manager_id_managers_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;
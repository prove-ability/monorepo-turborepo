ALTER TABLE "managers" DROP CONSTRAINT "managers_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "managers" ADD CONSTRAINT "managers_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
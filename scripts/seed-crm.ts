import { db } from "../server/db";
import { users, tables, sections } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function seedCRM() {
  console.log("Seeding CRM data...");

  try {
    // Create admin user
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await hashPassword("admin123");
      await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        email: "admin@hadoota.ae",
        role: "super_admin",
        isActive: true,
      });
      console.log("✅ Admin user created (username: admin, password: admin123)");
    } else {
      console.log("⏭️  Admin user already exists");
    }

    // Get all sections
    const allSections = await db.select().from(sections);

    if (allSections.length === 0) {
      console.log("❌ No sections found. Please run the main app seed first.");
      return;
    }

    // Create tables for each section
    for (const section of allSections) {
      const existingTables = await db
        .select()
        .from(tables)
        .where(eq(tables.sectionId, section.id))
        .limit(1);

      if (existingTables.length > 0) {
        console.log(`⏭️  Tables already exist for ${section.name}`);
        continue;
      }

      const tablesToCreate = [];
      let tableNum = 1;

      // Create 2-seater tables (3 tables)
      for (let i = 1; i <= 3; i++) {
        tablesToCreate.push({
          sectionId: section.id,
          tableNumber: `T${tableNum++}`,
          displayName: `Table ${i} (2-seater)`,
          minSeats: 1,
          maxSeats: 2,
          isActive: true,
        });
      }

      // Create 4-seater tables (4 tables)
      for (let i = 1; i <= 4; i++) {
        tablesToCreate.push({
          sectionId: section.id,
          tableNumber: `T${tableNum++}`,
          displayName: `Table ${i + 3} (4-seater)`,
          minSeats: 3,
          maxSeats: 4,
          isActive: true,
        });
      }

      // Create 6-seater tables (2 tables)
      for (let i = 1; i <= 2; i++) {
        tablesToCreate.push({
          sectionId: section.id,
          tableNumber: `T${tableNum++}`,
          displayName: `Table ${i + 7} (6-seater)`,
          minSeats: 5,
          maxSeats: 6,
          isActive: true,
        });
      }

      // Create 8-seater tables (1 table)
      tablesToCreate.push({
        sectionId: section.id,
        tableNumber: `T${tableNum++}`,
        displayName: `Table 10 (8-seater)`,
        minSeats: 7,
        maxSeats: 8,
        isActive: true,
      });

      await db.insert(tables).values(tablesToCreate);
      console.log(`✅ Created ${tablesToCreate.length} tables for ${section.name}`);
    }

    console.log("\n✅ CRM seeding completed successfully!");
    console.log("\nLogin credentials:");
    console.log("Username: admin");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error seeding CRM:", error);
    throw error;
  }
}

seedCRM()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { db } from "../server/db";
import { reservations, customers, branches, sections, tables } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedReservations() {
  console.log("Seeding sample reservations...");

  try {
    // Get branches
    const allBranches = await db.select().from(branches).limit(2);
    if (allBranches.length === 0) {
      console.log("❌ No branches found. Please seed branches first.");
      return;
    }

    // Get sections for first branch
    const branchSections = await db
      .select()
      .from(sections)
      .where(eq(sections.branchId, allBranches[0].id))
      .limit(3);

    if (branchSections.length === 0) {
      console.log("❌ No sections found. Please seed sections first.");
      return;
    }

    // Get some tables
    const sectionTables = await db
      .select()
      .from(tables)
      .where(eq(tables.sectionId, branchSections[0].id))
      .limit(5);

    // Create sample customers
    const sampleCustomers = [
      {
        phone: "+971501234567",
        email: "ahmed.hassan@email.com",
        firstName: "Ahmed",
        lastName: "Hassan",
        smokingPreference: "non_smoking" as const,
      },
      {
        phone: "+971507654321",
        email: "fatima.ali@email.com",
        firstName: "Fatima",
        lastName: "Ali",
        smokingPreference: "smoking_allowed" as const,
        isVip: true,
      },
      {
        phone: "+971509876543",
        email: "mohammed.salem@email.com",
        firstName: "Mohammed",
        lastName: "Salem",
        smokingPreference: "non_smoking" as const,
      },
      {
        phone: "+971501122334",
        email: "sara.khalid@email.com",
        firstName: "Sara",
        lastName: "Khalid",
        smokingPreference: "shisha_only" as const,
      },
    ];

    // Insert customers (skip if exists)
    const insertedCustomers = [];
    for (const customer of sampleCustomers) {
      const existing = await db
        .select()
        .from(customers)
        .where(eq(customers.phone, customer.phone))
        .limit(1);

      if (existing.length === 0) {
        const [inserted] = await db.insert(customers).values(customer).returning();
        insertedCustomers.push(inserted);
        console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName}`);
      } else {
        insertedCustomers.push(existing[0]);
        console.log(`⏭️  Customer already exists: ${customer.firstName} ${customer.lastName}`);
      }
    }

    // Generate dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Create sample reservations
    const sampleReservations = [
      // Today's reservations
      {
        confirmationNumber: `RES${Date.now()}001`,
        branchId: allBranches[0].id,
        sectionId: branchSections[0].id,
        tableId: sectionTables[0]?.id || null,
        customerId: insertedCustomers[0].id,
        guestName: `${insertedCustomers[0].firstName} ${insertedCustomers[0].lastName}`,
        guestEmail: insertedCustomers[0].email!,
        guestPhone: insertedCustomers[0].phone,
        date: formatDate(today),
        startTime: "19:00",
        endTime: "21:00",
        partySize: 4,
        smokingPreference: "non_smoking" as const,
        status: "confirmed" as const,
        specialRequests: "Window seat if available",
      },
      {
        confirmationNumber: `RES${Date.now()}002`,
        branchId: allBranches[0].id,
        sectionId: branchSections[1] ? branchSections[1].id : branchSections[0].id,
        tableId: sectionTables[1]?.id || null,
        customerId: insertedCustomers[1].id,
        guestName: `${insertedCustomers[1].firstName} ${insertedCustomers[1].lastName}`,
        guestEmail: insertedCustomers[1].email!,
        guestPhone: insertedCustomers[1].phone,
        date: formatDate(today),
        startTime: "20:30",
        endTime: "22:30",
        partySize: 2,
        smokingPreference: "smoking_allowed" as const,
        status: "confirmed" as const,
        occasion: "Anniversary",
      },
      {
        confirmationNumber: `RES${Date.now()}003`,
        branchId: allBranches[0].id,
        sectionId: branchSections[0].id,
        tableId: sectionTables[2]?.id || null,
        customerId: insertedCustomers[2].id,
        guestName: `${insertedCustomers[2].firstName} ${insertedCustomers[2].lastName}`,
        guestEmail: insertedCustomers[2].email!,
        guestPhone: insertedCustomers[2].phone,
        date: formatDate(today),
        startTime: "21:00",
        endTime: "23:00",
        partySize: 6,
        status: "pending" as const,
      },

      // Tomorrow's reservations
      {
        confirmationNumber: `RES${Date.now()}004`,
        branchId: allBranches[0].id,
        sectionId: branchSections[0].id,
        tableId: sectionTables[3]?.id || null,
        customerId: insertedCustomers[3].id,
        guestName: `${insertedCustomers[3].firstName} ${insertedCustomers[3].lastName}`,
        guestEmail: insertedCustomers[3].email!,
        guestPhone: insertedCustomers[3].phone,
        date: formatDate(tomorrow),
        startTime: "18:00",
        endTime: "20:00",
        partySize: 4,
        smokingPreference: "shisha_only" as const,
        status: "confirmed" as const,
      },
      {
        confirmationNumber: `RES${Date.now()}005`,
        branchId: allBranches[0].id,
        sectionId: branchSections[0].id,
        tableId: sectionTables[4]?.id || null,
        customerId: insertedCustomers[0].id,
        guestName: `${insertedCustomers[0].firstName} ${insertedCustomers[0].lastName}`,
        guestEmail: insertedCustomers[0].email!,
        guestPhone: insertedCustomers[0].phone,
        date: formatDate(tomorrow),
        startTime: "22:00",
        endTime: "00:00",
        partySize: 8,
        status: "confirmed" as const,
        occasion: "Business Dinner",
      },

      // Future reservations
      {
        confirmationNumber: `RES${Date.now()}006`,
        branchId: allBranches[0].id,
        sectionId: branchSections[0].id,
        tableId: null,
        customerId: insertedCustomers[1].id,
        guestName: `${insertedCustomers[1].firstName} ${insertedCustomers[1].lastName}`,
        guestEmail: insertedCustomers[1].email!,
        guestPhone: insertedCustomers[1].phone,
        date: formatDate(dayAfterTomorrow),
        startTime: "19:30",
        endTime: "21:30",
        partySize: 2,
        status: "pending" as const,
      },
      {
        confirmationNumber: `RES${Date.now()}007`,
        branchId: allBranches[0].id,
        sectionId: branchSections[0].id,
        tableId: null,
        customerId: insertedCustomers[2].id,
        guestName: `${insertedCustomers[2].firstName} ${insertedCustomers[2].lastName}`,
        guestEmail: insertedCustomers[2].email!,
        guestPhone: insertedCustomers[2].phone,
        date: formatDate(nextWeek),
        startTime: "20:00",
        endTime: "22:00",
        partySize: 5,
        status: "confirmed" as const,
        occasion: "Birthday Party",
        specialRequests: "Birthday cake arrangement needed",
      },
    ];

    // Insert reservations
    let count = 0;
    for (const reservation of sampleReservations) {
      const existing = await db
        .select()
        .from(reservations)
        .where(eq(reservations.confirmationNumber, reservation.confirmationNumber))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(reservations).values(reservation);
        count++;
      }
    }

    console.log(`\n✅ Created ${count} sample reservations`);
    console.log(`✅ Created ${insertedCustomers.length} sample customers`);
    console.log("\nReservation dates:");
    console.log(`  Today: ${formatDate(today)}`);
    console.log(`  Tomorrow: ${formatDate(tomorrow)}`);
    console.log(`  Day after: ${formatDate(dayAfterTomorrow)}`);
    console.log(`  Next week: ${formatDate(nextWeek)}`);

    // Update customer statistics
    for (const customer of insertedCustomers) {
      const customerReservations = await db
        .select()
        .from(reservations)
        .where(eq(reservations.customerId, customer.id));

      await db
        .update(customers)
        .set({
          totalVisits: customerReservations.length,
          lastVisitAt: new Date(),
        })
        .where(eq(customers.id, customer.id));
    }

    console.log("\n✅ Reservation seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding reservations:", error);
    throw error;
  }
}

seedReservations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

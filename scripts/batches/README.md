# Menu Import Batches

## Progress Summary

### ✅ Completed Batches (61+ items imported)

1. **01-breakfast-remaining.ts** ✓
   - 13 Breakfast items (Trays + Foul/Falafel/Egg Dishes)

2. **02-lunch-meals.ts** ✓
   - 11 Lunch Meal items

3. **03-soups-salads.ts** ✓
   - 13 items (5 Soups + 8 Salads)

4. **04-appetizers-cold.ts** ✓
   - 24 Cold Appetizer items

### 📝 To Run Next

5. **05-appetizers-hot.ts** (Hot Appetizers + Light Snacks)
   - ~17 items
   - Run: `npx tsx --env-file=.env scripts/batches/05-appetizers-hot.ts`

6. **06-feteer.ts** (Savory, Sweet, Meshaltet)
   - ~10 items
   - Run: `npx tsx --env-file=.env scripts/batches/06-feteer.ts`

7. **07-main-courses.ts** (All subcategories)
   - ~100 items (Koshari, Tagens, Escalope, Stuffed Veg, Pigeon, Fatta, Signature Trays)
   - Run: `npx tsx --env-file=.env scripts/batches/07-main-courses.ts`

8. **08-grills.ts**
   - ~30 items
   - Run: `npx tsx --env-file=.env scripts/batches/08-grills.ts`

9. **09-kids-sides-desserts.ts**
   - ~25 items
   - Run: `npx tsx --env-file=.env scripts/batches/09-kids-sides-desserts.ts`

10. **10-beverages.ts** (Hot, Cold, Soft Drinks)
    - ~40 items
    - Run: `npx tsx --env-file=.env scripts/batches/10-beverages.ts`

11. **11-shisha.ts**
    - ~2 main items + flavors
    - Run: `npx tsx --env-file=.env scripts/batches/11-shisha.ts`

## How to Run

From the CRM root directory:

```bash
cd "/Users/home/Desktop/Hadoota Masreya CRM"

# Run batches one by one
npx tsx --env-file=.env scripts/batches/05-appetizers-hot.ts
npx tsx --env-file=.env scripts/batches/06-feteer.ts
# ... and so on
```

## Check Progress

Run this anytime to see current counts:
```bash
npx tsx --env-file=.env scripts/check-progress.ts
```

## Branch Availability

- **SZR**: Most items
- **IBN**: Most items + Light Snacks subcategory

## Notes

- All prices are stored in fils (AED * 100)
- Items are linked to categories via both old (category) and new (category_id) schema
- Branch availability is managed via menu_item_branches table

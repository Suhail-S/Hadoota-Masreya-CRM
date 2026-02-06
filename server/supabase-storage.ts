import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Slugify function to create safe filenames from item names
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Upload menu item image to Supabase Storage
 * @param fileBuffer - The file buffer from multer
 * @param itemName - The menu item name (used for filename)
 * @param fileExt - File extension (jpg, png, webp)
 * @returns The filename (not full URL) to store in database
 */
export async function uploadMenuItemImage(
  fileBuffer: Buffer,
  itemName: string,
  fileExt: string
): Promise<string> {
  try {
    // Generate filename from item name with timestamp for uniqueness
    const slugifiedName = slugify(itemName);
    const timestamp = Date.now();
    const filename = `${slugifiedName}-${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('menu-items')
      .upload(filename, fileBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false, // Don't overwrite, create new file
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Return just the filename (not the full URL)
    // The frontend can construct the URL when needed
    return filename;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Get public URL for a menu item image
 * @param filename - The filename stored in database
 * @returns The public URL to access the image
 */
export function getMenuItemImageUrl(filename: string): string {
  const { data } = supabase.storage
    .from('menu-items')
    .getPublicUrl(filename);

  return data.publicUrl;
}

/**
 * Delete a menu item image from storage
 * @param filename - The filename to delete
 */
export async function deleteMenuItemImage(filename: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('menu-items')
      .remove([filename]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    throw error;
  }
}

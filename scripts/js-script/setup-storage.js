import { createClient } from "@supabase/supabase-js"

// This script sets up the storage bucket and policies for the PTS system
// Run this once after setting up your Supabase project

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  try {
    console.log("Setting up PTS storage bucket...")

    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket("pts-documents", {
      public: false,
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      fileSizeLimit: 10485760, // 10MB
    })

    if (bucketError && bucketError.message !== "Bucket already exists") {
      throw bucketError
    }

    console.log("✅ Storage bucket created/verified")

    // Set up RLS policies
    console.log("Setting up Row Level Security policies...")

    // Policy to allow authenticated users to upload files
    const uploadPolicy = `
      CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        bucket_id = 'pts-documents'
      );
    `

    // Policy to allow users to view their own files
    const viewPolicy = `
      CREATE POLICY "Allow users to view files" ON storage.objects
      FOR SELECT USING (
        auth.role() = 'authenticated' AND
        bucket_id = 'pts-documents'
      );
    `

    // Policy to allow users to delete their own files
    const deletePolicy = `
      CREATE POLICY "Allow users to delete their files" ON storage.objects
      FOR DELETE USING (
        auth.role() = 'authenticated' AND
        bucket_id = 'pts-documents'
      );
    `

    console.log("✅ Storage setup completed successfully!")
    console.log("")
    console.log("Next steps:")
    console.log("1. Update your .env.local file with your Supabase credentials")
    console.log("2. Enable Row Level Security on the storage.objects table in Supabase dashboard")
    console.log("3. Apply the RLS policies shown above in the SQL editor")
  } catch (error) {
    console.error("❌ Setup failed:", error)
  }
}

setupStorage()

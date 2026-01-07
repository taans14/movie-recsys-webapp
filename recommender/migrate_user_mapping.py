"""
User Mapping Migration Script
Version: 1.0

Purpose:
Migrate existing users from ratings collection to user_mapping table
This creates SVD Integer IDs for all existing users

Run this ONCE before first retrain with new system
"""

from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def migrate_user_mapping():
    """
    Create user_mapping entries for all existing users
    
    Process:
    1. Get all unique userIds from ratings
    2. Assign SVD IDs starting from 1
    3. Insert into user_mapping collection
    4. New users will get IDs starting from 1000+
    """
    print("=" * 60)
    print("🔄 USER MAPPING MIGRATION")
    print("=" * 60)
    
    # Connect to MongoDB
    try:
        client = MongoClient(os.getenv("MONGO_URI"))
        db = client["movie-recsys"]
        ratings_col = db["ratings"]
        user_mapping_col = db["user_mapping"]
        
        print("\n✅ Connected to MongoDB")
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        return

    # Get unique users from ratings
    print("\n📊 Analyzing existing users...")
    unique_users = ratings_col.distinct("userId")
    total_users = len(unique_users)
    
    print(f"   Found {total_users:,} unique users")

    # Check if migration already done
    existing_mappings = user_mapping_col.count_documents({})
    if existing_mappings > 0:
        print(f"\n⚠️ Warning: {existing_mappings} mappings already exist!")
        response = input("   Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("   Migration cancelled.")
            return

    # Create mappings
    print("\n🔧 Creating user mappings...")
    
    svd_id_counter = 1  # Start from 1 for existing users
    success_count = 0
    skipped_count = 0
    
    for i, user_mongo_id in enumerate(unique_users):
        if (i + 1) % 1000 == 0:
            print(f"   Progress: {i+1:,}/{total_users:,} ({(i+1)/total_users*100:.1f}%)")
        
        # Check if mapping already exists
        existing = user_mapping_col.find_one({"mongoId": user_mongo_id})
        
        if existing:
            skipped_count += 1
            continue
        
        # Insert new mapping
        try:
            user_mapping_col.insert_one({
                "mongoId": user_mongo_id,
                "svdId": svd_id_counter,
                "createdAt": None,  # NULL for migrated users
                "migrated": True    # Flag to identify migrated users
            })
            
            success_count += 1
            svd_id_counter += 1
        except Exception as e:
            print(f"\n   ❌ Error mapping user {user_mongo_id}: {e}")

    # Summary
    print("\n" + "=" * 60)
    print("✅ MIGRATION COMPLETED")
    print("=" * 60)
    print(f"Total users processed: {total_users:,}")
    print(f"Successfully mapped:   {success_count:,}")
    print(f"Skipped (existing):    {skipped_count:,}")
    print(f"Next SVD ID:           {svd_id_counter}")
    print("\nℹ️  New users will get SVD IDs starting from 1000")
    print("=" * 60)

    # Verify migration
    print("\n🔍 Verifying migration...")
    final_count = user_mapping_col.count_documents({})
    print(f"   Total mappings in DB: {final_count:,}")
    
    if final_count >= total_users:
        print("   ✅ Verification passed!")
    else:
        print("   ⚠️ Warning: Mapping count mismatch!")

    # Create indexes for performance
    print("\n📇 Creating indexes...")
    try:
        user_mapping_col.create_index("mongoId", unique=True)
        user_mapping_col.create_index("svdId", unique=True)
        print("   ✅ Indexes created")
    except Exception as e:
        print(f"   ⚠️ Index creation warning: {e}")

if __name__ == "__main__":
    migrate_user_mapping()
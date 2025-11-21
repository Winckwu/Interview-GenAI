#!/bin/bash
# Run message branches migration with proper permissions

echo "🔧 Fixing database permissions..."
psql -U postgres -d interview_genai -f scripts/fix-permissions.sql

if [ $? -eq 0 ]; then
    echo "✓ Permissions fixed"
    echo ""
    echo "📦 Running message_branches migration..."
    psql -U postgres -d interview_genai -f src/config/migrations_message_branches.sql

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migration completed successfully!"
        echo "🎉 Conversation branching system is now ready!"
    else
        echo ""
        echo "❌ Migration failed. Check the error messages above."
        exit 1
    fi
else
    echo ""
    echo "❌ Permission fix failed. Check the error messages above."
    exit 1
fi

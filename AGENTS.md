==================================================
MODEL ASSIGNMENT POLICY
==================================================

The Coordinator must assign models according to task complexity.

HIGH-REASONING TASKS:
Use Claude Opus 5 Thinking High.

- Coordinator
- Architecture
- Major refactoring
- Security architecture
- Critical database migrations
- Complex cross-module debugging
- Payment architecture
- Major production incidents

STANDARD DEVELOPMENT:
Use Claude Sonnet 5 Thinking High.

- Backend implementation
- Frontend implementation
- Admin implementation
- Database implementation
- Orders
- Inventory
- CMS
- Analytics
- Reviews
- API development

ROUTINE TASKS:
Use a faster/cheaper capable model when appropriate.

- Simple UI changes
- Copy changes
- Small CSS fixes
- Simple tests
- Documentation
- Formatting
- Minor bug fixes

IMPORTANT:

Do not use Claude Opus for every task.

Use the strongest model only when the complexity justifies it.

Before assigning a task, classify it as:

CRITICAL_REASONING
STANDARD_DEVELOPMENT
ROUTINE

Then select the appropriate model.

Never downgrade a critical architectural or security task
to a routine model merely to reduce usage.

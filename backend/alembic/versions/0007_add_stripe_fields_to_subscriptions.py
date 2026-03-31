"""구독 테이블에 Stripe 연동 필드 추가

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-31 00:00:00.000000

변경 내용:
- subscriptions 테이블에 stripe_customer_id, stripe_subscription_id 컬럼 추가
"""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("subscriptions", sa.Column("stripe_customer_id", sa.String(255), nullable=True))
    op.add_column("subscriptions", sa.Column("stripe_subscription_id", sa.String(255), nullable=True))
    op.create_index("ix_subscriptions_stripe_customer_id", "subscriptions", ["stripe_customer_id"], unique=True)
    op.create_index("ix_subscriptions_stripe_subscription_id", "subscriptions", ["stripe_subscription_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_subscriptions_stripe_subscription_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_stripe_customer_id", table_name="subscriptions")
    op.drop_column("subscriptions", "stripe_subscription_id")
    op.drop_column("subscriptions", "stripe_customer_id")

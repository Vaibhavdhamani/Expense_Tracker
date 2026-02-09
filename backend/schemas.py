from flask_marshmallow import Marshmallow
from marshmallow import fields, validate

ma = Marshmallow()

class UserSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    created_at = fields.DateTime(dump_only=True)
    
    class Meta:
        fields = ('id', 'username', 'email', 'created_at')


class CategorySchema(ma.Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=50))
    icon = fields.Str()
    color = fields.Str()
    
    class Meta:
        fields = ('id', 'name', 'icon', 'color')


class StandardDescriptionSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    category_id = fields.Int(required=True)
    description = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    is_active = fields.Bool()
    
    class Meta:
        fields = ('id', 'category_id', 'description', 'is_active')


class ExpenseSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    category_id = fields.Int(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=0))
    description = fields.Str(validate=validate.Length(max=200))
    notes = fields.Str()
    date = fields.DateTime(required=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Nested fields for related data
    category = fields.Nested(CategorySchema, dump_only=True)
    
    class Meta:
        fields = ('id', 'user_id', 'category_id', 'amount', 'description', 
                 'notes', 'date', 'created_at', 'updated_at', 'category')


class BudgetSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    category_id = fields.Int(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=0))
    period = fields.Str(validate=validate.OneOf(['daily', 'weekly', 'monthly', 'yearly']))
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime()
    is_active = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    
    # Nested fields
    category = fields.Nested(CategorySchema, dump_only=True)
    
    class Meta:
        fields = ('id', 'user_id', 'category_id', 'amount', 'period', 
                 'start_date', 'end_date', 'is_active', 'created_at', 'category')


class BudgetPredictionSchema(ma.Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    category_id = fields.Int()
    predicted_amount = fields.Float(required=True)
    confidence_score = fields.Float()
    prediction_period = fields.Str()
    features_used = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    
    class Meta:
        fields = ('id', 'user_id', 'category_id', 'predicted_amount', 
                 'confidence_score', 'prediction_period', 'features_used', 'created_at')


# Initialize schema instances
user_schema = UserSchema()
users_schema = UserSchema(many=True)

category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)

standard_description_schema = StandardDescriptionSchema()
standard_descriptions_schema = StandardDescriptionSchema(many=True)

expense_schema = ExpenseSchema()
expenses_schema = ExpenseSchema(many=True)

budget_schema = BudgetSchema()
budgets_schema = BudgetSchema(many=True)

budget_prediction_schema = BudgetPredictionSchema()
budget_predictions_schema = BudgetPredictionSchema(many=True)

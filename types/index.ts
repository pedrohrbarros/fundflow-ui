export interface ExpensePaymentMethod {
  payment_method_id: string
  partial_amount: number
  name: string
  origin: string
  receiver: string | null
}

export interface Expense {
  id: string
  name: string
  amount: number
  period_amount: number
  date: string
  is_recurring: boolean
  recurring_months: number | null
  category_id: string | null
  is_paid: boolean
  is_saved: boolean
  saving_location: string | null
  payment_methods: ExpensePaymentMethod[]
  created_at: string
  updated_at: string
}

export interface ExpensesResponse {
  expenses: Expense[]
  total: number
  pagination: { page: number; limit: number; total: number }
}

export interface CreateExpenseBody {
  name: string
  category_id?: number | null
  amount: number
  date: string
  is_recurring?: boolean
  recurring_months?: number | null
  is_paid?: boolean
  is_saved?: boolean
  saving_location?: string | null
  payment_methods?: { payment_method_id: number; partial_amount: number }[]
}

export interface UpdateExpenseBody {
  name?: string
  category_id?: number | null
  amount?: number
  date?: string
  is_recurring?: boolean
  recurring_months?: number | null
  is_paid?: boolean
  is_saved?: boolean
  saving_location?: string | null
  payment_methods?: { payment_method_id: number; partial_amount: number }[]
}

export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  created_at: string
  updated_at: string
}

export interface CategoriesResponse {
  categories: Category[]
  pagination: { page: number; limit: number; total: number }
}

export interface CreateCategoryBody {
  name: string
  type: 'INCOME' | 'EXPENSE'
}

export interface UpdateCategoryBody {
  name: string
}

export interface SourceOfIncome {
  id: string
  name: string
  category_id: string | null
  income: number
  period_amount: number
  date: string
  is_recurring: boolean
  currency: string
  created_at: string
  updated_at: string
}

export interface SourceOfIncomeGroup {
  category_id: number | null
  category_name: string | null
  sources: SourceOfIncome[]
}

export interface SourcesOfIncomeResponse {
  sources_of_income: SourceOfIncomeGroup[]
  total: { [currency: string]: number }
  pagination: { page: number; limit: number; total: number }
}

export interface CreateSourceOfIncomeBody {
  name: string
  category_id?: number | null
  income?: number
  currency?: string
  date: string
  is_recurring?: boolean
}

export interface UpdateSourceOfIncomeBody {
  name?: string
  category_id?: number | null
  income?: number
  currency?: string
  date?: string
  is_recurring?: boolean
}

export interface PaymentMethod {
  id: string
  name: string
  origin: string
  receiver: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface PaymentMethodsResponse {
  payment_methods: PaymentMethod[]
  pagination: { page: number; limit: number; total: number }
}

export interface CreatePaymentMethodBody {
  name: string
  origin: string
  receiver?: string
}

export interface UpdatePaymentMethodBody {
  name?: string
  origin?: string
  receiver?: string | null
}

export interface ApiError {
  error: string
}

export interface User {
  id: string
  email: string
  country: string
  created_at: string
  updated_at: string
}

export interface UpdateUserCountryBody {
  country: string
}

export interface ExpenseCategoryTotal {
  category_id: number
  name: string
  total: number
  count: number
}

export interface ExpensesByCategoryResponse {
  by_category: ExpenseCategoryTotal[]
  total: number
}

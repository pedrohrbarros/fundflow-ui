export interface ExpensePaymentMethod {
  payment_method_id: string
  partial_amount: number
}

export interface Expense {
  id: string
  name: string
  amount: number
  is_paid: boolean
  is_saved: boolean
  saving_location: string | null
  payment_methods: ExpensePaymentMethod[]
  created_at: string
  updated_at: string
}

export interface ExpensesResponse {
  expenses: Expense[]
  pagination: { page: number; limit: number; total: number }
}

export interface CreateExpenseBody {
  name: string
  amount: number
  is_paid?: boolean
  is_saved?: boolean
  saving_location?: string | null
  payment_methods?: { payment_method_id: number; partial_amount: number }[]
}

export interface UpdateExpenseBody {
  name?: string
  amount?: number
  is_paid?: boolean
  is_saved?: boolean
  saving_location?: string | null
  payment_methods?: { payment_method_id: number; partial_amount: number }[]
}

export interface Category {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface CategoriesResponse {
  categories: Category[]
}

export interface CreateCategoryBody {
  name: string
}

export interface UpdateCategoryBody {
  name: string
}

export interface SourceOfIncome {
  id: string
  name: string
  category_id: string
  income: number
  created_at: string
  updated_at: string
}

export interface SourcesOfIncomeResponse {
  sources_of_income: SourceOfIncome[]
}

export interface CreateSourceOfIncomeBody {
  name: string
  category_id: number
  income?: number
}

export interface UpdateSourceOfIncomeBody {
  name?: string
  category_id?: number
  income?: number
}

export interface PaymentMethod {
  id: string
  name: string
  bank: string | null
  receiver: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface PaymentMethodsResponse {
  payment_methods: PaymentMethod[]
}

export interface CreatePaymentMethodBody {
  name: string
  bank?: string
  receiver?: string
}

export interface UpdatePaymentMethodBody {
  name?: string
  bank?: string | null
  receiver?: string | null
}

export interface ApiError {
  error: string
}

import { AccountForm } from '../accounts/AccountForm';
import { AccountList } from '../accounts/AccountList';
import { ProductForm } from '../products/ProductForm';
import { ProductList } from '../products/ProductList';
import { TransactionForm } from '../transactions/TransactionForm';
import { TransactionList } from '../transactions/TransactionList';

export function TransactionsView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-fg-2 text-xs uppercase tracking-wide">accounts</h3>
        <AccountForm />
        <AccountList />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-fg-2 text-xs uppercase tracking-wide">products</h3>
        <ProductForm />
        <ProductList />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-fg-2 text-xs uppercase tracking-wide">add transaction</h3>
        <TransactionForm />
      </section>
      <section className="flex flex-col gap-3">
        <h3 className="text-fg-2 text-xs uppercase tracking-wide">transaction history</h3>
        <TransactionList />
      </section>
    </div>
  );
}

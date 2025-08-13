import React from "react";

const AdminDashboard: React.FC = () => {
  React.useEffect(() => { document.title = "Admin | Overview"; }, []);
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="p-4 rounded-lg border">
        <h3 className="font-medium">Users & Points</h3>
        <p className="text-sm text-muted-foreground">Adjust balances and view activity</p>
      </article>
      <article className="p-4 rounded-lg border">
        <h3 className="font-medium">Products</h3>
        <p className="text-sm text-muted-foreground">Add, edit, and manage inventory</p>
      </article>
      <article className="p-4 rounded-lg border">
        <h3 className="font-medium">Orders</h3>
        <p className="text-sm text-muted-foreground">Review recent orders</p>
      </article>
    </section>
  );
};

export default AdminDashboard;

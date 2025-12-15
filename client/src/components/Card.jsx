export default function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-brand-100 dark:border-gray-700 p-4 transition-shadow hover:shadow-xl">
      <div className="font-medium mb-2">{title}</div>
      <div>{children}</div>
    </div>
  );
}

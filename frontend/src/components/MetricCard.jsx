const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  currency = false,
  order = "",
}) => (
  <div
    className="bg-[rgb(var(--bg))] p-6 rounded-md shadow-md border border-[rgb(var(--border))] space-y-3" style={{order}}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium opacity-50">{title}</p>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
    <p>
      <span
        className={`font-bold ${title.toLowerCase() === "total investment" ? colorClass + " text-4xl" : "text-3xl"}`}
      >
        {value}
      </span>
      {currency && <span className="ml-1 font-bold text-[1.1rem]">PKR</span>}
    </p>
  </div>
);

export default MetricCard;

const StatusBadge = ({ status }) => {
  let colorClass;

switch (status) {
  case "ACTIVE":
    colorClass = "bg-green-900 text-white";
    break;

  case "PENDING":
    colorClass = "bg-yellow-500 text-white";
    break;

  case "COMPLETED":
    colorClass = "bg-green-700 text-white";
    break;

  case "PAID":
    colorClass = "bg-green-500 text-white";
    break;

  case "LATE":
    colorClass = "bg-red-500 text-white";
    break;

  case "IN":
    colorClass = "text-green-600";
    break;

  case "OUT":
    colorClass = "text-red-600";
    break;

  default:
    colorClass = "bg-gray-300 text-gray-800";
    break;
}


  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase ${colorClass}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
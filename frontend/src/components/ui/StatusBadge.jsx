const StatusBadge = ({ status }) => {
  let colorClass;

  switch (status) {
    case "ACTIVE":
      colorClass = "bg-yellow-500 text-white";
      break;

    case "PENDING":
      colorClass = "bg-yellow-300 text-white";
      break;

    case "COMPLETED":
    case "PAID":
      colorClass = "bg-green-600 text-white";
      break;

    case "CANCELLED":
    case "LATE":
      colorClass = "bg-red-100 text-white";
      break;

    case "RETURNED":
      colorClass = "bg-red-500 text-white";
      break;

    case "IN":
      colorClass = "text-green-500";
      break;

    case "OUT":
      colorClass = "text-red-500";
      break;

    default:
      colorClass = "bg-gray-200 text-white";
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
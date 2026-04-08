// Displays the barber's photo (or initials), name, and shop name at the top of the page.

interface BarberHeaderProps {
  name: string;
  shopName: string;
  photoUrl: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function BarberHeader({ name, shopName, photoUrl }: BarberHeaderProps) {
  return (
    <div className="flex flex-col items-center pt-8 pb-6">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-semibold text-gray-500">
          {getInitials(name)}
        </div>
      )}
      <h1 className="mt-3 text-xl font-semibold text-gray-900">{name}</h1>
      <p className="text-sm text-gray-500">{shopName}</p>
    </div>
  );
}

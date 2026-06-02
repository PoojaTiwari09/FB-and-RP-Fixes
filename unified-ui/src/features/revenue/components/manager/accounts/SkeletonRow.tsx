'use client';

export default function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3">
        <div className="skeleton h-3.5 w-32 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-20 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-6 rounded" /></td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton w-2.5 h-2.5 rounded-full" />)}
        </div>
      </td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-20 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-28 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-20 rounded" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-24 rounded" /></td>
    </tr>
  );
}

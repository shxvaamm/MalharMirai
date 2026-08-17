import { MemberSearchFilter } from "@/components/public/member-search-filter";

export default function MembersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-100">
          Society <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Members</span>
        </h1>
      </div>

      {/* Interactive Member Directory Search & Filters */}
      <MemberSearchFilter />
    </div>
  );
}

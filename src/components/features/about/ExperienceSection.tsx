import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { Timeline } from "../../ui/timeline";
import { Terminal } from "lucide-react";

export function ExperienceSection() {
  const { data: work } = useSuspenseQuery(convexQuery(api.resume.getExperiences, {}));

  const workItems = work.map(w => ({
    _id: w._id,
    year: w.startDate.slice(0, 4),
    title: w.role,
    subtitle: w.company,
    description: w.description
  }));

  return (
    <section className="container px-4 md:px-6">
      <h2 className="mb-8 flex items-center gap-3 text-3xl font-bold">
        <Terminal className="text-(--color-ubuntu-orange)" />
        Experience
      </h2>
      <div className="rounded-lg border border-(--color-border) bg-(--color-surface)/50 p-6 md:p-10">
        {workItems.length > 0 ? (
          <Timeline items={workItems} />
        ) : (
          <p className="text-(--color-text-secondary)">No experience data found.</p>
        )}
      </div>
    </section>
  );
}

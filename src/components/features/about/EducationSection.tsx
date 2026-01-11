import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../../convex/_generated/api";
import { Timeline } from "../../ui/timeline";

export function EducationSection() {
  const { data: education } = useSuspenseQuery(convexQuery(api.resume.getEducation, {}));

  const eduItems = education.map(e => ({
    _id: e._id,
    year: e.startDate.slice(0, 4),
    title: e.degree,
    subtitle: e.institution,
    description: e.field
  }));

  return (
    <section className="container px-4 md:px-6">
      <h2 className="mb-8 text-3xl font-bold">Education</h2>
      <div className="rounded-lg border border-(--color-border) bg-(--color-surface)/50 p-6 md:p-10">
        {eduItems.length > 0 ? (
          <Timeline items={eduItems} />
        ) : (
          <p className="text-(--color-text-secondary)">No education data found.</p>
        )}
      </div>
    </section>
  );
}

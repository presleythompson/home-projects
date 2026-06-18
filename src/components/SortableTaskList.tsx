"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Person, Task } from "@/lib/types";
import TaskRow from "./TaskRow";

type Handlers = {
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onDelete: (task: Task) => void;
};

// Each row is a sortable item. The drag activator is the grip that TaskRow shows
// in place of the checkbox while its title is being edited — so there's no
// permanent drag affordance, but any open task can be reordered.
function SortableTaskRow({
  task,
  people,
  currentPersonId,
  taskHandlers,
  projectLabel,
}: {
  task: Task;
  people: Person[];
  currentPersonId: number | null;
  taskHandlers: Handlers;
  projectLabel?: string;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        task={task}
        people={people}
        currentPersonId={currentPersonId}
        projectLabel={projectLabel}
        dragAttributes={attributes}
        dragListeners={listeners}
        setActivatorNodeRef={setActivatorNodeRef}
        {...taskHandlers}
      />
    </div>
  );
}

export default function SortableTaskList({
  tasks,
  people,
  currentPersonId,
  taskHandlers,
  onReorder,
  projectLabelFor,
}: {
  tasks: Task[];
  people: Person[];
  currentPersonId: number | null;
  taskHandlers: Handlers;
  onReorder: (ids: number[]) => void;
  projectLabelFor?: (task: Task) => string | undefined;
}) {
  // @dnd-kit generates a11y ids that differ server vs client; only mount the
  // drag tree after hydration to avoid a mismatch warning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Drag starts from the grip (shown on title-edit), so immediate activation is
  // fine. The grip has touch-action:none so dragging it won't scroll.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(tasks, oldIndex, newIndex).map((t) => t.id));
  }

  if (!mounted) {
    // Pre-hydration: plain rows (no drag tree, no grip).
    return (
      <div className="divide-y divide-line/60">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            people={people}
            currentPersonId={currentPersonId}
            projectLabel={projectLabelFor?.(task)}
            {...taskHandlers}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-line/60">
          {tasks.map((task) => (
            <SortableTaskRow
              key={task.id}
              task={task}
              people={people}
              currentPersonId={currentPersonId}
              taskHandlers={taskHandlers}
              projectLabel={projectLabelFor?.(task)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

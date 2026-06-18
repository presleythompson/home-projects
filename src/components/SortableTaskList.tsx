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
import { dueLabel } from "@/lib/util";
import TaskRow from "./TaskRow";
import { GripIcon } from "./icons";

type Handlers = {
  onToggle: (task: Task) => void;
  onRename: (id: number, title: string) => void;
  onAssign: (id: number, personId: number | null) => void;
  onSetDue: (id: number, due: string | null) => void;
  onDelete: (task: Task) => void;
};

// A reorder-mode row: a grip (the only drag activator) + the title. Other
// controls are intentionally hidden while reordering so the gesture is
// unambiguous and there's nothing to mis-tap. Handle-only drag means iOS never
// hijacks it with text selection.
function ReorderRow({ task, projectLabel }: { task: Task; projectLabel?: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.85 : undefined,
  };

  const due = dueLabel(task.due_date);

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2.5 py-2.5 select-none">
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        aria-label="Drag to reorder task"
      >
        <GripIcon className="w-[18px] h-[18px]" />
      </button>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] leading-6 text-ink truncate">{task.title}</span>
        {projectLabel && <span className="block mt-0.5 text-[12px] text-muted truncate">{projectLabel}</span>}
      </span>
      {task.due_date && <span className="text-[12px] text-muted flex-shrink-0">{due.text}</span>}
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
  reordering,
}: {
  tasks: Task[];
  people: Person[];
  currentPersonId: number | null;
  taskHandlers: Handlers;
  onReorder: (ids: number[]) => void;
  projectLabelFor?: (task: Task) => string | undefined;
  reordering: boolean;
}) {
  // @dnd-kit generates a11y ids that differ server vs client; only mount the
  // drag tree after hydration to avoid a mismatch warning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Drag starts from the grip handle, so immediate activation is fine — no
  // long-press needed. The handle has touch-action:none so dragging it won't
  // scroll, while touching elsewhere still scrolls.
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

  // Normal mode: the usual interactive rows, no drag tree at all.
  if (!reordering || !mounted) {
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

  // Reorder mode: grip-drag simplified rows.
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-line/60">
          {tasks.map((task) => (
            <ReorderRow key={task.id} task={task} projectLabel={projectLabelFor?.(task)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

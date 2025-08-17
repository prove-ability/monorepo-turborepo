import { ClassList } from "./components/class-list";

export default function ClassesPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">클래스 관리</h1>
      </div>
      <ClassList />
    </div>
  );
}

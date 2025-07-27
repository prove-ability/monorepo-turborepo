import { getClasses } from "@/actions/classActions";
import { ClassList } from "./components/class-list";

export default async function ClassesPage() {
  try {
    const classes = await getClasses();
    
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">클래스 관리</h1>
        </div>
        <ClassList initialClasses={classes} />
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">클래스 관리</h1>
        <p className="text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다: {error instanceof Error ? error.message : "알 수 없는 오류"}
        </p>
      </div>
    );
  }
}

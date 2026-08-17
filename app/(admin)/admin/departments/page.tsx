"use client";

import * as React from "react";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Users,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAdminData } from "@/lib/hooks/use-admin-data";
import { useToast } from "@/components/ui/toast";
import {
  CreateDepartmentDialog,
  EditDepartmentDialog,
} from "@/components/admin/department-dialogs";
import { DeleteConfirmDialog } from "@/components/admin/member-dialogs";
import { deleteDepartmentAction } from "@/lib/actions/departments";
import { Department } from "@/lib/mock-data";

export default function AdminDepartmentsPage() {
  const {
    departments,
    members,
    addDepartmentToState,
    updateDepartment,
    deleteDepartment,
    loading,
  } = useAdminData();
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editDept, setEditDept] = React.useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Department | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteDepartmentAction(deleteTarget.id);
    if (result.success) {
      deleteDepartment(deleteTarget.id);
      toast({
        title: "Department Deleted",
        description: `"${deleteTarget.name}" has been removed.`,
        type: "warning",
      });
    } else {
      deleteDepartment(deleteTarget.id);
      toast({
        title: "Department Removed",
        description: `"${deleteTarget.name}" removed from local state.`,
        type: "warning",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-xs font-medium mb-2">
            <Layers className="h-3.5 w-3.5 text-neutral-400" /> 5 Official Society Pillars
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">
            Society <span className="text-transparent bg-clip-text bg-gradient-to-b from-neutral-200 via-neutral-300 to-neutral-500">Departments</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage society departments, coordinator leads, and responsibilities.
          </p>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 shadow-sm rounded-full font-semibold bg-[#E5E5E5] text-neutral-950 hover:bg-[#D4D4D4]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Department</span>
        </Button>
      </div>

      {/* Loading state */}
      {loading && departments.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-400">Loading departments from database...</p>
        </div>
      )}

      {/* Department Cards Grid */}
      {(departments.length > 0 || !loading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const deptMembersCount = members.filter(
              (m) => m.department.toLowerCase() === dept.name.toLowerCase()
            ).length;

            return (
              <Card
                key={dept.id}
                className="glass-panel border-white/[0.06] bg-[#0D0D0D]/75 hover:border-white/15 transition-all duration-200 flex flex-col justify-between rounded-3xl shadow-xl"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="member" className="text-[10px] bg-white/[0.04] text-neutral-300 border-white/10">
                      {deptMembersCount > 0 ? deptMembersCount : dept.memberCount || 25} Coordinators
                    </Badge>
                    <span className="text-xs text-neutral-300 font-medium truncate max-w-[140px]">
                      {dept.lead || "Coordinator"}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-neutral-100">{dept.name}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed text-neutral-400 line-clamp-3 mt-1">
                    {dept.description}
                  </CardDescription>
                </CardHeader>

                <CardFooter className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditDept(dept)}
                    className="text-xs h-8 border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.07] rounded-full"
                  >
                    <Edit className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                    <span>Edit Department</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(dept)}
                    className="text-xs h-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-full"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}


      {/* Dialogs */}
      <CreateDepartmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(newDept) => {
          addDepartmentToState(newDept);
          toast({
            title: "Department Created",
            description: `"${newDept.name}" is now live.`,
            type: "success",
          });
        }}
        onError={(err) => {
          toast({
            title: "Creation Failed",
            description: err,
            type: "error",
          });
        }}
      />

      <EditDepartmentDialog
        department={editDept}
        open={!!editDept}
        onOpenChange={(op) => !op && setEditDept(null)}
        onSuccess={(updatedDept) => {
          updateDepartment(updatedDept.id, {
            name: updatedDept.name,
            description: updatedDept.description,
            lead: updatedDept.lead,
          });
          toast({
            title: "Department Updated",
            description: `"${updatedDept.name}" records synchronized.`,
            type: "success",
          });
        }}
        onError={(err) => {
          toast({
            title: "Update Failed",
            description: err,
            type: "error",
          });
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(op) => !op && setDeleteTarget(null)}
        title="Delete Department"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}

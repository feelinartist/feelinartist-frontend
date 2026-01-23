import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getAuthOptions } from "@/lib/auth";
import RoleSelectionContent from "./role-selection-content";

export default async function RoleSelectionPage() {
    const authOptions = getAuthOptions();
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    const userRole = session.user?.rol;
    if (userRole) {
        redirect('/home');
    }

    return <RoleSelectionContent />;
}

import { redirect } from 'next/navigation';
export default async function Page({params}:PageProps<'/support/in-progress/[id]'>){const {id}=await params;redirect(`/support/tickets/${id}`);}

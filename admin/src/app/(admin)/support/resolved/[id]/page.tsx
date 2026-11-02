import { redirect } from 'next/navigation';
export default async function Page({params}:PageProps<'/support/resolved/[id]'>){const {id}=await params;redirect(`/support/tickets/${id}`);}

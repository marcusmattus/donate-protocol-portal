import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { NavDark } from "@/components/nav-dark"
import { SiteFooter } from "@/components/site-footer"
import { CharityProfileClient } from "./profile-client"
import { CATEGORY_META, CHARITIES, DONATIONS, findCharity } from "@/lib/demo-data"

export async function generateStaticParams() {
  return CHARITIES.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const c = findCharity(id)
  if (!c) return { title: "Charity not found" }
  const label = CATEGORY_META[c.category].label
  return {
    title: `${c.name} · ${label}`,
    description: c.mission,
    openGraph: {
      title: `${c.name} · ${label}`,
      description: c.mission,
      type: "article",
    },
  }
}

export default async function CharityProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const charity = findCharity(id)
  if (!charity) notFound()
  const donations = DONATIONS.filter((d) => d.toCharityId === charity.id)
  const related = CHARITIES
    .filter((c) => c.id !== charity.id && c.category === charity.category)
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 terminal-grid flex flex-col">
      <NavDark />
      <CharityProfileClient charity={charity} donations={donations} related={related} />
      <SiteFooter />
    </div>
  )
}

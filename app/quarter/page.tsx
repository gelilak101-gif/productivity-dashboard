import { db } from '@/lib/db'
import { quarterlyGoals, bigPictureItems, gymSessions } from '@/lib/schema'
import { gte } from 'drizzle-orm'
import { format, startOfYear } from 'date-fns'
import QuarterView from '@/components/dashboard/QuarterView'
import { desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getCurrentQuarterKey() {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}

export default async function QuarterPage() {
  const quarterKey = getCurrentQuarterKey()
  const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd')

  const [goals, bigPicture, gymData] = await Promise.all([
    db.select().from(quarterlyGoals),
    db.select().from(bigPictureItems).orderBy(desc(bigPictureItems.createdAt)),
    db.select().from(gymSessions).where(gte(gymSessions.sessionDate, yearStart)),
  ])

  return (
    <QuarterView
      initialGoals={goals}
      initialBigPicture={bigPicture}
      gymSessions={gymData}
      currentQuarterKey={quarterKey}
    />
  )
}

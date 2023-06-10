import { dbESPAPI } from '$server/dbESP'

const FILENAME = '/routes/apps/cm/temp/example/server.ts'

export async function POST({ request }) {
	const { formName, actionType, actionURL, actionMethod, actionData } = await request.json()
	return await dbESPAPI(actionMethod, actionURL, actionData)
}

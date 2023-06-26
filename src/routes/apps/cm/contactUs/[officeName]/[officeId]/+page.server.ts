import { getForm } from '$server/dbForm'

export async function load({ locals, params }) {
	console.log('contactUs+page.server.params:', params)
	return {
		user: locals.user,
		officeName: params.officeName,
		officeId: params.officeId,
		formDefn: await getForm('cm_contact_us_rec', { ...locals.user, ...params })
	}
}

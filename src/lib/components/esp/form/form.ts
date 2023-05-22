import { FieldCheckbox } from '$comps/esp/form/fieldCheckbox'
import { FieldInput } from '$comps/esp/form/fieldInput'
import { FieldRadio } from '$comps/esp/form/fieldRadio'
import { FieldSelect } from '$comps/esp/form/fieldSelect'
import { FieldTextarea } from '$comps/esp/form/fieldTextarea'
import { getArrayOfModels, strRqd, strLower, valueOrDefault } from '$lib/utils/utils'

export class Form {
	id: string
	header: string
	subHeader: string
	description: string
	submitButtonLabel: string
	height: string
	action: string
	sql: string
	fields: []
	footerText: Array<FooterText>
	footerLinks: Array<FooterLinks>

	constructor(obj) {
		obj = valueOrDefault(obj, {})
		this.id = strLower(valueOrDefault(obj.id, ''))
		this.header = valueOrDefault(obj.header, '')
		this.subHeader = valueOrDefault(obj.subHeader, '')
		this.description = valueOrDefault(obj.description, '')
		this.submitButtonLabel = valueOrDefault(obj.submitButtonLabel, 'Submit')
		this.height = valueOrDefault(obj.height, '')
		this.sql = valueOrDefault(obj.sql, '')
		this.action = obj.action || (obj.sql ? '/form?/sql' : '')
		this.fields = this.initFields(obj.fields)
		this.footerText = getArrayOfModels(FooterText, obj.footerText)
		this.footerLinks = getArrayOfModels(FooterLink, obj.footerLinks)
	}

	get getDefn() {
		return JSON.stringify({
			name: this.name,
			label: this.label,
			description: this.description,
			submitButtonLabel: this.submitButtonLabel,
			fields: this.fields
		})
	}

	initFields(fields) {
		fields = valueOrDefault(fields, [])
		let newFields = []
		fields.forEach((field, index) => {
			let newField
			const element = strRqd(field.element)
			switch (element) {
				case FieldElement.input:
					const type = strRqd(field.type)
					switch (type) {
						case 'checkbox':
							newField = new FieldCheckbox(field, index)
							break
						case 'radio':
							newField = new FieldRadio(field, index)
							break
						default:
							// input column
							newField = new FieldInput(field, index, newFields)
					}
					break

				case FieldElement.select:
					newField = new FieldSelect(field, index)
					break

				case FieldElement.textarea:
					newField = new FieldTextarea(field, index)
					break
			}
			// matchColumn
			if (newField.matchColumn) {
				const idxParent = newFields.map((f) => f.name).indexOf(newField.matchColumn)
				if (idxParent >= 0) {
					const message = `Fields "${newFields[idxParent].label}" and "${newField.label}" must match.`
					// set parent
					newFields[idxParent].matchColumn = {
						name: newField.name,
						index: newField.index,
						message
					}
					// update child
					newField.matchColumn = {
						name: newFields[idxParent].name,
						index: newFields[idxParent].index,
						message
					}
				}
			}
			newFields.push(newField)
		})
		return newFields
	}

	validateForm(formData: FormData): Validation {
		// set formData
		let validityFields: Array<ValidityField> = []
		let values: Array<FieldValue> = []

		// process each field
		for (let i = 0; i < this.fields.length; i++) {
			// can't break out of "forEach" loop
			const validation: Validation = this.fields[i].validate(formData)

			if (validation.status == ValidationStatus.valid) {
				validityFields = [...validation.validityFields]
				values.push(new FieldValue(this.fields[i].name, validation.data))
			} else {
				return validation
			}
		}
		return new Validation(ValidationType.form, ValidationStatus.valid, validityFields, values)
	}
}

export class FieldValue {
	name: string
	value: any

	constructor(name: string, value: any) {
		this.name = name
		this.value = value
	}
}
export class Validity {
	type: ValidityType
	message: string
	level: ValidityLevel

	constructor(
		type: ValidityType = ValidityType.valid,
		message: string = '',
		level: ValidityLevel = ValidityLevel.none
	) {
		this.type = type
		this.message = message
		this.level = level
	}
}
export class ValidityField {
	index: number
	validity: Validity

	constructor(index: number, validity: Validity) {
		this.index = index
		this.validity = validity
	}
}
export class Validation {
	type: ValidationType
	status: ValidationStatus
	validityFields: Array<ValidityField>
	data: Array<FieldValue>

	constructor(
		type: ValidationType,
		status: ValidationStatus,
		validityFields: Array<ValidityField>,
		data: Array<FieldValue>
	) {
		this.type = type
		this.status = status
		this.validityFields = validityFields
		this.data = data
	}
}
export class FooterText {
	label: string
	size: string
	constructor(obj) {
		obj = obj != null ? obj : {}
		this.label = valueOrDefault(obj.label, '')
		this.size = this.label ? (this.size = valueOrDefault(obj.size, 'text-base')) : ''
	}
}
export class FooterLink {
	prefix: string
	label: string
	action: string

	constructor(obj) {
		obj = obj != null ? obj : {}
		this.prefix = valueOrDefault(obj.prefix, '')
		this.label = valueOrDefault(obj.label, '')
		this.action = valueOrDefault(obj.action, '')
	}
}
export enum FieldElement {
	input = 'input',
	select = 'select',
	textarea = 'textarea'
}
export enum ValidationStatus {
	valid = 'valid',
	notinvalid = 'notinvalid',
	invalid = 'invalid'
}
export enum ValidationType {
	field = 'field',
	form = 'form'
}
export enum ValidityType {
	valid = 'valid',
	required = 'required',
	minLength = 'minLength',
	maxLength = 'maxLength',
	minValue = 'minValue',
	maxValue = 'maxValue',
	pattern = 'pattern',
	matchColumn = 'matchColumn'
}
export enum ValidityLevel {
	none = 'none',
	warning = 'warning',
	error = 'error'
}

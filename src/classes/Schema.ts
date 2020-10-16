/*
 * File: Schema.ts
 * Created: 10/14/2020 13:03:39
 * ----
 * Copyright: 2020 Nix² Technologies
 * Author: Max Koon (maxk@nix2.io)
 */

import Field from './Field';
import { titleCase } from 'koontil';

export default class Schema {
    private id: Field;

    constructor(
        public identifier: string,
        public label: string,
        public description: string,
        public pluralName: string,
        public _fields: { [id: string]: Field },
    ) {
        this.id = new Field(
            '_id',
            'ID',
            `Id of the ${label}`,
            'number',
            true,
            null,
            new Set(['pk']),
        );
    }

    static deserialize(data: { [key: string]: any }): Schema {
        return new Schema(
            data.identifier,
            data.label,
            data.description,
            data.pluralName,
            Object.assign(
                {},
                ...Object.keys(data.fields).map((k) => ({
                    [k]: Field.deserialize(k, data.fields[k]),
                })),
            ),
        );
    }

    serialize(): { [key: string]: any } {
        return {
            identifier: this.identifier,
            label: this.label,
            description: this.description,
            // This just runs the .serialize() method over the fields object
            fields: Object.assign(
                {},
                ...Object.keys(this.fields).map((k) => ({
                    [k]: this.fields[k].serialize(),
                })),
            ),
        };
    }

    get fields(): { [id: string]: Field } {
        return Object.assign(
            {
                [this.id.name]: this.id,
            },
            this._fields,
        );
    }

    get pascalCase(): string {
        return titleCase(this.label).replace(/ /g, '');
    }
}

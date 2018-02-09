'use strict';

const RequiredRules = require('./RequiredRules');

class BaseValidator {
    constructor(context, fields) {
        this.ctx           = context;
        this.fields        = fields;
        this.rule          = {};
        this.validations   = {};
        this.requiredRules = new RequiredRules(this);
    }

    parseKey(key, data) {
        let value;

        const keySplit = key.split('.').filter((e) => e !== '');

        keySplit.forEach((item) => {
            if (typeof value === 'undefined') {
                value = data && data[item];
            } else {
                value = value[item];
            }
        });

        if (typeof value === 'undefined') {
            value = data && data[key];
        }

        return value;
    }

    addError(key, type, rule, message) {
        this.ctx.validationErrors = this.ctx.validationErrors || [];

        const e = {
            [key]: {
                type,
                message
            }
        };

        if (type === 'filter') {
            e[key].filter = rule;
        } else {
            e[key].rule = rule;
        }

        this.ctx.validationErrors.push(e);
    }

    populateRule(field, rule, messages) {
        const key = `${field}.${rule}`;

        let message = messages[key] || messages[rule];

        if (message) {
            if (message.indexOf(':attribute') !== -1) {
                message = message.replace(':attribute', field);
            }

            if (message.indexOf(':value') !== -1) {
                if (typeof this.validations[field].value === 'object') {
                    message = message.replace(':value', JSON.stringify(this.validations[field].value));
                } else if (typeof this.validations[field].value === 'undefined') {
                    message = message.replace(':value', 'undefined');
                } else {
                    message = message.replace(':value', this.validations[field].value.toString());
                }
            }
        }

        this.rule.message = message;

        if (typeof this.requiredRules[this.rule.rule] === 'function') {
            this.validations[field].rules.unshift(this.rule);
        } else {
            this.validations[field].rules.push(this.rule);
        }
    }

    * applyValidations() {
        const fieldValidations = [];

        for (let val in this.validations) { // eslint-disable-line prefer-const
            fieldValidations.push(this.evaluateField(this.validations[val]));
        }

        if (fieldValidations.length) {
            yield fieldValidations;
        }

        return !(this.ctx.validationErrors && this.ctx.validationErrors.length);
    }
}

module.exports = BaseValidator;

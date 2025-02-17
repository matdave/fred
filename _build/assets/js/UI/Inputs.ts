import fredConfig from '@fred/Config';
import emitter from "../EE";
import flatpickr from "flatpickr";
import Choices from 'choices.js';
import ColorPicker from './../ColorPicker/ColorPicker';
import noUiSlider from 'nouislider';
import Finder from "./../Finder";
import {div, label, input, select as selectElement, span, textArea, a, img} from './Elements';
import {fixChoices, valueParser} from "../Utils";
import Tagger from "./Tagger";
import { getResources, getChunks } from '../Actions/pages';
import { getGroups } from '../Actions/tagger';

type Setting = {
    label?: string;
    name: string;
    type: string;
    value?: any;
};

type EnhancedLabel<R> = HTMLLabelElement & {
    inputEl: R;
};

type OnInit<S = Setting, L = HTMLLabelElement, I = HTMLInputElement> = (setting: S, label: L, input: I) => void;
type OnChange<S = Setting, I = HTMLInputElement> = (name: string, value: any, input: I, setting: S) => void;

type TextSetting = Setting & {
    labelAsPlaceholder?: boolean;
};
export const text = (
    setting: TextSetting,
    defaultValue: string = '',
    onChange: OnChange<TextSetting>,
    onInit: OnInit<TextSetting>
) => {
    let labelEl;
    if (setting.labelAsPlaceholder === true) {
        labelEl = label('', ['fred--label-'+setting.name]);
    } else {
        labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]);
    }

    const inputEl = input(defaultValue);

    labelEl.inputEl = inputEl;

    if (setting.labelAsPlaceholder === true) {
        inputEl.setAttribute('placeholder', setting.label || setting.name);
    }

    let errorEl = null;

    inputEl.addEventListener('keyup', e => {
        if (errorEl !== null) {
            errorEl.remove();
            inputEl.removeAttribute('aria-invalid');
            errorEl = null;
        }

        if (typeof onChange === 'function') {
            onChange(setting.name, inputEl.value, inputEl, setting);
        }
    });

    labelEl.onError = msg => {
        inputEl.setAttribute('aria-invalid', 'true');
        if (errorEl === null) {
            errorEl = div('error', msg);
            labelEl.appendChild(errorEl);
        } else {
            errorEl.innerHTML = msg;
        }
    };

    labelEl.appendChild(inputEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }

    return labelEl;
};

type SelectSetting = Setting & {
    options: {[key: string]: string};
};
export const select = (
    setting: SelectSetting,
    defaultValue: string = '',
    onChange: OnChange<SelectSetting, HTMLSelectElement>,
    onInit: OnInit<SelectSetting, EnhancedLabel<HTMLSelectElement>, HTMLSelectElement>
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]) as EnhancedLabel<HTMLSelectElement>;

    const selectEl = selectElement();
    labelEl.inputEl = selectEl;

    if (setting.options) {
        for (let value in setting.options) {
            if (setting.options.hasOwnProperty(value)) {
                const option = document.createElement('option');
                if (fredConfig.lngExists(setting.options[value])) {
                    option.innerHTML = fredConfig.lng(setting.options[value]);
                } else {
                    option.innerHTML = setting.options[value];
                }
                option.value = value;

                if (value === defaultValue) {
                    option.setAttribute('selected', 'selected');
                }

                selectEl.appendChild(option);
            }
        }
    }

    if (typeof onChange === 'function') {
        selectEl.addEventListener('change', e => {
            if (setting.options[selectEl.value]) {
                onChange(setting.name, selectEl.value, selectEl, setting);
            }
        });
    }

    labelEl.appendChild(selectEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, selectEl);
    }

    return labelEl;
};

export const toggle = (
    setting: Setting,
    defaultValue: boolean = false,
    onChange: OnChange,
    onInit: (setting: Setting, label: EnhancedLabel<HTMLInputElement>, input: HTMLInputElement, span: HTMLSpanElement) => void
) => {
    const labelEl = label((setting.label || setting.name), 'fred--toggle') as EnhancedLabel<HTMLInputElement>;

    const inputEl = input(defaultValue, 'checkbox');

    labelEl.inputEl = inputEl;

    if (typeof onChange === 'function') {
        inputEl.addEventListener('change', e => {
            onChange(setting.name, (e.target as HTMLInputElement).checked, inputEl, setting);
        });
    }

    const spanEl = span();

    labelEl.appendChild(inputEl);
    labelEl.appendChild(spanEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl, spanEl);
    }

    return labelEl;
};

type ToggleGroupSetting = Setting & {
    options: {[key: string]: string};
};
type MultiOnChange<S = Setting, I = HTMLInputElement> = (name: string, value: any, input: I, setting: S, add: boolean) => void;
export const toggleGroup = (
    setting: ToggleGroupSetting,
    defaultValue: string = '',
    onChange: MultiOnChange,
    onInit: (setting: ToggleGroupSetting, label: EnhancedLabel<HTMLInputElement>, input: HTMLInputElement, span: HTMLSpanElement) => void
) => {
    const labelEl = span(['fred--label'], (setting.label || setting.name));
    const values = defaultValue.split('||');

    if (setting.options) {
        for (let value in setting.options) {
            if (setting.options.hasOwnProperty(value)) {
                let inputEl = input(value, 'checkbox');
                let spanEl = span();
                let smallLabel = setting.options[value];
                if (fredConfig.lngExists(setting.options[value])) {
                    smallLabel = fredConfig.lng(setting.options[value]);
                }
                let smallLableEl = label(smallLabel, 'fred--toggle') as EnhancedLabel<HTMLInputElement>;

                inputEl.value = value;

                if (values.indexOf(value) != -1) {
                    inputEl.setAttribute('checked', 'checked');
                }

                if (typeof onChange === 'function') {
                    inputEl.addEventListener('change', e => {
                        onChange(setting.name, inputEl.value, inputEl, setting, inputEl.checked);
                    });
                }

                smallLableEl.appendChild(inputEl);
                smallLableEl.appendChild(spanEl);
                labelEl.appendChild(smallLableEl);

                if (typeof onInit === 'function') {
                    onInit(setting, smallLableEl, inputEl, spanEl);
                }
            }
        }
    }

    return labelEl;
};

type AreaSetting = Setting & {
    rows: string|number;
};
export const area = (
    setting: AreaSetting,
    defaultValue: string = '',
    onChange: OnChange<AreaSetting, HTMLTextAreaElement>,
    onInit: OnInit<AreaSetting, EnhancedLabel<HTMLTextAreaElement>, HTMLTextAreaElement>
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]) as EnhancedLabel<HTMLTextAreaElement>;

    const textAreaEl = textArea(defaultValue);
    labelEl.inputEl = textAreaEl;

    if (setting.rows && (parseInt('' + setting.rows) > 0)) {
        textAreaEl.setAttribute('rows', '' + parseInt('' + setting.rows));
    } else {
        textAreaEl.setAttribute('rows', '4');
    }

    if (typeof onChange === 'function') {
        textAreaEl.addEventListener('keyup', e => {
            onChange(setting.name, textAreaEl.value, textAreaEl, setting);
        });
    }

    labelEl.appendChild(textAreaEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, textAreaEl);
    }

    return labelEl;
};

export const dateTime = (
    setting: Setting,
    defaultValue: string|number = 0,
    onChange: OnChange<Setting, any>,
    onInit: OnInit<Setting, EnhancedLabel<HTMLInputElement> & {picker: any}, any>,
    dateFormat?: string
) => {
    defaultValue = parseInt('' + defaultValue) || 0;

    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]) as EnhancedLabel<HTMLInputElement> & {picker: any};
    const group = div(['fred--input-group', 'fred--datetime']);
    const inputEl = input();
    labelEl.inputEl = inputEl;

    const picker = flatpickr(inputEl, {
        enableTime: true,
        dateFormat: ( dateFormat === undefined) ? "Y-m-d H:i" : dateFormat,
        appendTo: group,
        defaultDate: (defaultValue === 0) ? '' : (defaultValue * 1000),
        onChange: selectedDates => {
            if (typeof onChange === 'function') {
                if (selectedDates.length === 0) {
                    onChange(setting.name, 0, picker, setting);
                } else {
                    onChange(setting.name, selectedDates[0].getTime() / 1000, picker, setting);
                }
            }
        }
    });

    labelEl.picker = picker;

    const clear = a('', 'fred.fe.clear', '', 'fred--close-small', () => {
        picker.clear();
    });

    group.appendChild(inputEl);
    group.appendChild(clear);

    labelEl.appendChild(group);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }

    return labelEl;
};

type ColorSwatchSetting = Setting & {
    options: (string|{
        color: string;
        value: string;
        label?: string;
        width?: string|number;
        colorAsClass?: boolean;
    })[];
};
export const colorSwatch = (
    setting: ColorSwatchSetting,
    defaultValue: string = '',
    onChange: OnChange<ColorSwatchSetting, HTMLDivElement>,
    onInit: (setting: ColorSwatchSetting, label: HTMLLabelElement, wrapper: HTMLDivElement, preview: HTMLDivElement, colors: HTMLDivElement) => void
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]);
    const wrapper = div('fred--color_swatch');
    const preview = div('fred--color_swatch-preview');
    const colors = div(['fred--color_swatch-colors', 'fred--hidden']);

    if (defaultValue) {
        preview.style.backgroundColor = defaultValue;
    }

    let isOpen = false;

    preview.addEventListener('click', e => {
        e.preventDefault();
        if (isOpen === false) {
            isOpen = true;
            colors.classList.remove('fred--hidden');
        } else {
            isOpen = false;
            colors.classList.add('fred--hidden');
        }
    });

    let defaultValueTranslated = false;

    if (setting.options) {
        setting.options.forEach(value => {
            if (typeof value === 'object') {
                const colorAsClass = !!value.colorAsClass;

                const option = div('fred--color_swatch-color');

                if (colorAsClass) {
                    option.classList.add(value.color);
                } else {
                    option.style.background = value.color;
                }

                if (value.width && parseFloat('' + value.width) > 1) {
                    option.style.width = (parseFloat('' + value.width) * 30) + 'px';
                }

                if (value.label && value.label.trim() !== '') {
                    option.setAttribute('data-tooltip', value.label);
                }

                if (!defaultValueTranslated && defaultValue && (value.value === defaultValue)) {
                    defaultValueTranslated = true;

                    if (defaultValue) {
                        if (colorAsClass) {
                            preview.classList.add(value.color);
                        } else {
                            preview.style.background = value.color;
                        }
                    }
                }

                option.addEventListener('click', e => {
                    e.preventDefault();
                    if (typeof onChange === 'function') {
                        onChange(setting.name, value.value, option, setting);
                    }

                    if (colorAsClass) {
                        preview.classList.add(value.color);
                    } else {
                        preview.style.background = value.color;
                    }
                });

                colors.appendChild(option);
            } else {
                const option = div('fred--color_swatch-color');
                option.style.backgroundColor = value;

                option.addEventListener('click', e => {
                    e.preventDefault();
                    if (typeof onChange === 'function') {
                        onChange(setting.name, value, option, setting);
                    }

                    preview.style.background = value;
                });

                colors.appendChild(option);
            }
        });
    }

    wrapper.appendChild(preview);
    wrapper.appendChild(colors);

    labelEl.appendChild(wrapper);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, wrapper, preview, colors);
    }

    return labelEl;
};

type ColorPickerSetting = Setting & {
    options: string[];
    showAlpha?: boolean;
};
export const colorPicker = (
    setting: ColorPickerSetting,
    defaultValue = '',
    onChange: OnChange<ColorPickerSetting>,
    onInit: (setting:ColorPickerSetting, label: HTMLLabelElement, wrapper: HTMLDivElement, preview: HTMLDivElement, picker: HTMLDivElement) => void
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]);
    const wrapper = div('fred--color_picker');
    const preview = div('fred--color_picker-preview');

    let isOpen = false;
    let pickerInstance = null;

    preview.addEventListener('click', e => {
        e.preventDefault();
        if (isOpen === false) {
            isOpen = true;

            pickerInstance = ColorPicker.createPicker({
                attachTo: picker,
                color: defaultValue,
                showAlpha: (setting.showAlpha === undefined) ? true : setting.showAlpha,
                paletteEditable: false,
                palette: setting.options || null
            });

            pickerInstance.onchange = (picker) => {
                if (typeof onChange === 'function') {
                    onChange(setting.name, picker.color, picker, setting);
                }

                preview.style.backgroundColor = picker.color;
                defaultValue = picker.color;
            };
        } else {
            if (pickerInstance !== null) {
                pickerInstance.element.remove();
                pickerInstance = null;
            }

            isOpen = false;
        }
    });

    if (defaultValue) {
        preview.style.backgroundColor = defaultValue;
    }

    const picker = div();

    wrapper.appendChild(preview);
    wrapper.appendChild(picker);

    labelEl.appendChild(wrapper);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, wrapper, preview, picker);
    }

    return labelEl;
};

type SliderSetting = Setting & {
    min?: number;
    max?: number;
    step?: number;
    tooltipDecimals?: number;
};
export const slider = (
    setting: SliderSetting,
    defaultValue: number = 0,
    onChange: OnChange<SliderSetting, HTMLDivElement>,
    onInit: OnInit<SliderSetting, HTMLLabelElement, HTMLDivElement & {noUiSlider: any}>
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]);

    if (!setting.min && !setting.max) {
        console.error('Slider Input error. Parameters min and max are required');
        return labelEl;
    }

    const sliderEl = div() as HTMLDivElement & {noUiSlider: any};

    let init = false;
    let step = 1;
    if (setting.step) {
        step = setting.step;
    } else {
        if (setting.tooltipDecimals) {
            step = Math.pow(10, -1 * setting.tooltipDecimals);
        }
    }

    const slider = noUiSlider.create(sliderEl, {
        start: defaultValue,
        connect: [true, false],
        tooltips: {
            to: value => {
                const decimals = (setting.tooltipDecimals === undefined) ? 0 : setting.tooltipDecimals;

                if (decimals === 0) {
                    return parseInt(value.toFixed());
                }

                return parseFloat(value.toFixed(decimals));
            }
        },
        format: {
            to: function ( value ) {
                const decimals = (setting.tooltipDecimals === undefined) ? 0 : setting.tooltipDecimals;

                if (decimals === 0) {
                    return parseInt(value.toFixed());
                }

                return parseFloat(value.toFixed(decimals));
            },
            from: function ( value ) {
                const decimals = (setting.tooltipDecimals === undefined) ? 0 : setting.tooltipDecimals;

                if (decimals === 0) {
                    return parseInt(value);
                }

                return parseFloat(value).toFixed(decimals);
            }
        },
        step: step,
        range: {
            'min': setting.min,
            'max': setting.max
        }
    });

    sliderEl.querySelector('.noUi-handle').addEventListener('keydown', (e: KeyboardEvent) => {
        const value = Number(sliderEl.noUiSlider.get());

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            sliderEl.noUiSlider.set(value - step);
        }

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            sliderEl.noUiSlider.set(value + step);
        }
    });

    if (typeof onChange === 'function') {
        slider.on('update', (values, handle, unencoded, tap, positions) => {
            if (init === false) {
                init = true;
            } else {
                onChange(setting.name, values[0], slider, setting);
            }
        });
    }

    labelEl.appendChild(sliderEl);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, sliderEl);
    }

    return labelEl;
};

type PageSetting = Setting & {
    clearButton?: boolean;
    parents?: string|(string|number)[];
    resources?: string|(string|number)[];
    depth?: number;
};
export const page = (
    setting: PageSetting,
    defaultValue: {id: number, url: string} = {id: 0, url: ''},
    onChange: OnChange<PageSetting, any>,
    onInit: OnInit<PageSetting, HTMLLabelElement, HTMLSelectElement>
) => {
    const wrapper = div();
    const labelEl = label((setting.label || setting.name), 'fred--label-choices');
    const selectEl = selectElement();

    if (!defaultValue || (typeof(defaultValue) !== 'object') || (defaultValue.id === undefined) || (defaultValue.url === undefined)) {
        defaultValue = {id: 0, url: ''};
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(selectEl);

    let lookupTimeout = null;
    const lookupCache = {};
    let initData = [];

    const pageChoices = new Choices(selectEl, {
        shouldSort:false,
        removeItemButton: setting.clearButton || false,
        searchResultLimit: 0
    }) as any;

    fixChoices(pageChoices);

    const queryOptions: Pick<PageSetting, 'parents'|'resources'|'depth'> = {};

    if (setting.parents) {
        queryOptions.parents = setting.parents;
    }

    if (setting.resources) {
        queryOptions.resources = setting.resources;
    }

    if (setting.depth) {
        queryOptions.depth = setting.depth;
    }

    pageChoices.ajax(callback => {
        getResources(defaultValue.id, queryOptions)
            .then(json => {
                initData = json.data.resources;
                callback(json.data.resources, 'value', 'pagetitle');

                if (json.data.current) {
                    pageChoices.setChoices([json.data.current], 'value', 'pagetitle', false);
                    pageChoices.setValueByChoice("" + defaultValue.id);
                }
            })
            .catch(error => {
                emitter.emit('fred-loading', error.message);
            });
    });

    const populateOptions = options => {
        const toRemove = [];

        pageChoices.currentState.items.forEach(item => {
            if (item.active) {
                toRemove.push(item.value);
            }
        });

        const toKeep = [];
        options.forEach(option => {
            if (toRemove.indexOf(option.id) === -1) {
                toKeep.push(option);
            }
        });

        pageChoices.setChoices(toKeep, 'value', 'pagetitle', true);
    };

    const serverLookup = () => {
        const query = pageChoices.input.value;
        if (query in lookupCache) {
            populateOptions(lookupCache[query]);
        } else {
            getResources(null, {query, ...queryOptions})
                .then(data => {
                    lookupCache[query] = data.data.resources;
                    populateOptions(data.data.resources);
                })
                .catch(error => {
                    emitter.emit('fred-loading', error.message);
                });
        }
    };

    pageChoices.passedElement.addEventListener('search', event => {
        clearTimeout(lookupTimeout);
        lookupTimeout = setTimeout(serverLookup, 200);
    });

    pageChoices.passedElement.addEventListener('choice', event => {
        pageChoices.setChoices(initData, 'value', 'pagetitle', true);

        if (typeof onChange === 'function') {
            onChange(setting.name, {
                url: event.detail.choice.customProperties.url,
                id: event.detail.choice.value
            }, pageChoices, setting);
        }
    });

    pageChoices.passedElement.addEventListener('removeItem', event => {
        if (pageChoices.getValue()) return;

        if (typeof onChange === 'function') {
            onChange(setting.name, {url: '', id: ''}, pageChoices, setting);
        }
    });

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, selectEl);
    }

    return wrapper;
};

type ChunkSetting = Setting & {
    clearButton?: boolean;
    category?: string|(string|number)[];
    chunks?: string|(string|number)[];
};
export const chunk = (
    setting: ChunkSetting,
    defaultValue: {id: number, name: string} = {id: 0, name: ''},
    onChange: OnChange<ChunkSetting, any>,
    onInit: OnInit<ChunkSetting, HTMLLabelElement, HTMLSelectElement>
) => {
    const wrapper = div();
    const labelEl = label((setting.label || setting.name), ['fred--label-'+setting.name, 'fred--label-choices']);
    const selectEl = selectElement();

    if (!defaultValue || (typeof(defaultValue) !== 'object') || (defaultValue.id === undefined) || (defaultValue.name === undefined)) {
        defaultValue = {id: 0, name: ''};
    }

    wrapper.appendChild(labelEl);
    wrapper.appendChild(selectEl);

    let lookupTimeout = null;
    const lookupCache = {};
    let initData = [];

    const chunkChoices = new Choices(selectEl, {
        shouldSort:false,
        removeItemButton: setting.clearButton || false,
        searchResultLimit: 0
    }) as any;

    fixChoices(chunkChoices);

    const queryOptions: Pick<ChunkSetting, 'category'|'chunks'> = {};

    if (setting.category) {
        queryOptions.category = setting.category;
    }

    if (setting.chunks) {
        queryOptions.chunks = setting.chunks;
    }

    chunkChoices.ajax(callback => {
        getChunks(defaultValue.id, queryOptions)
            .then(json => {
                initData = json.data.chunks;
                callback(json.data.chunks, 'value', 'name');

                if (json.data.current) {
                    chunkChoices.setChoices([json.data.current], 'value', 'name', false);
                    chunkChoices.setValueByChoice("" + defaultValue.id);
                }
            })
            .catch(error => {
                emitter.emit('fred-loading', error.message);
            });
    });

    const populateOptions = options => {
        const toRemove = [];

        chunkChoices.currentState.items.forEach(item => {
            if (item.active) {
                toRemove.push(item.value);
            }
        });

        const toKeep = [];
        options.forEach(option => {
            if (toRemove.indexOf(option.id) === -1) {
                toKeep.push(option);
            }
        });

        chunkChoices.setChoices(toKeep, 'value', 'name', true);
    };

    const serverLookup = () => {
        const query = chunkChoices.input.value;
        if (query in lookupCache) {
            populateOptions(lookupCache[query]);
        } else {
            getChunks(null, {query, ...queryOptions})
                .then(data => {
                    lookupCache[query] = data.data.chunks;
                    populateOptions(data.data.chunks);
                })
                .catch(error => {
                    emitter.emit('fred-loading', error.message);
                });
        }
    };

    chunkChoices.passedElement.addEventListener('search', event => {
        clearTimeout(lookupTimeout);
        lookupTimeout = setTimeout(serverLookup, 200);
    });

    chunkChoices.passedElement.addEventListener('choice', event => {
        chunkChoices.setChoices(initData, 'value', 'name', true);

        if (typeof onChange === 'function') {
            onChange(setting.name, {
                name: event.detail.choice.label,
                id: event.detail.choice.value
            }, chunkChoices, setting);
        }
    });

    chunkChoices.passedElement.addEventListener('removeItem', event => {
        if (chunkChoices.getValue()) return;

        if (typeof onChange === 'function') {
            onChange(setting.name, {name: '', id: ''}, chunkChoices, setting);
        }
    });

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, selectEl);
    }

    return wrapper;
};

type ImageSetting = Setting & {
    showPreview?: boolean;
    mediaSource?: string;
};
export const image = (
    setting: ImageSetting,
    defaultValue: string = '',
    onChange: OnChange<ImageSetting>,
    onInit: OnInit<ImageSetting>
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]) as EnhancedLabel<HTMLInputElement> & {setPreview: (src: string) => void};

    setting.showPreview = (setting.showPreview === undefined) ? true : setting.showPreview;

    const inputWrapper = div(['fred--input-group', 'fred--browse']);

    const inputEl = input(defaultValue);
    labelEl.inputEl = inputEl;

    const openFinderButton = a('', 'fred.fe.browse', '', 'fred--browse-small');

    const preview = img('');
    let previewAdded = false;

    const finderOptions: Pick<ImageSetting, 'mediaSource'> = {};

    if (setting.mediaSource && (setting.mediaSource !== '')) {
        finderOptions.mediaSource = setting.mediaSource;
    }

    inputEl.addEventListener('keyup', e => {
        if((setting.showPreview === true) && inputEl.value) {
            preview.src = valueParser(inputEl.value);
            if (!previewAdded) {
                labelEl.appendChild(preview);
                previewAdded = true;
            }
        } else {
            if (previewAdded) {
                preview.src = '';
                preview.remove();
                previewAdded = false;
            }
        }

        if (typeof onChange === 'function') {
            onChange(setting.name, inputEl.value, inputEl, setting);
        }
    });

    const openFinder = e => {
        e.preventDefault();

        const finder = new Finder((file, fm) => {
            let value = file.url;

            if (value.indexOf(fredConfig.config.themeDir) === 0) {
                value = value.replace(fredConfig.config.themeDir, '{{theme_dir}}');
            }

            if (typeof onChange === 'function') {
                onChange(setting.name, value, inputEl, setting);
            }

            inputEl.value = value;
            preview.src = valueParser(value);

            if ((setting.showPreview === true) && !previewAdded) {
                labelEl.appendChild(preview);
                previewAdded = true;
            }
        }, 'fred.fe.browse_images', finderOptions);

        finder.render();
    };

    openFinderButton.addEventListener('click', openFinder);
    preview.addEventListener('click', openFinder);

    inputWrapper.appendChild(inputEl);
    inputWrapper.appendChild(openFinderButton);

    labelEl.appendChild(inputWrapper);

    if(inputEl.value) {
        preview.src = valueParser(inputEl.value);
    }

    if ((setting.showPreview === true) && preview.src) {
        labelEl.appendChild(preview);
        previewAdded = true;
    }

    labelEl.setPreview = src => {
        if (setting.showPreview !== true) return;
        preview.src = valueParser(src);

        if (previewAdded === false) {
            labelEl.appendChild(preview);
            previewAdded = true;
        }
    };

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }

    return labelEl;
};

type FileSetting = Setting & {
    mediaSource?: string;
};
export const file = (
    setting: FileSetting,
    defaultValue: string = '',
    onChange: OnChange<FileSetting>,
    onInit: OnInit<FileSetting>
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]) as EnhancedLabel<HTMLInputElement>;

    const inputWrapper = div(['fred--input-group', 'fred--browse']);

    const inputEl = input(defaultValue);
    labelEl.inputEl = inputEl;

    const openFinderButton = a('', 'fred.fe.browse', '', 'fred--browse-small');

    const finderOptions: Pick<FileSetting, 'mediaSource'> = {};

    if (setting.mediaSource && (setting.mediaSource !== '')) {
        finderOptions.mediaSource = setting.mediaSource;
    }

    inputEl.addEventListener('keyup', e => {
        if (typeof onChange === 'function') {
            onChange(setting.name, inputEl.value, inputEl, setting);
        }
    });

    const openFinder = e => {
        e.preventDefault();

        const finder = new Finder((file, fm) => {
            let value = file.url;

            if (value.indexOf(fredConfig.config.themeDir) === 0) {
                value = value.replace(fredConfig.config.themeDir, '{{theme_dir}}');
            }

            if (typeof onChange === 'function') {
                onChange(setting.name, value, inputEl, setting);
            }

            inputEl.value = value;
        }, 'fred.fe.browse_files', finderOptions);

        finder.render();
    };

    openFinderButton.addEventListener('click', openFinder);

    inputWrapper.appendChild(inputEl);
    inputWrapper.appendChild(openFinderButton);

    labelEl.appendChild(inputWrapper);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }

    return labelEl;
};

type FolderSetting = Setting & {
    showOnlyFolders?: boolean;
    mediaSource?: string;
};
export const folder = (
    setting: FolderSetting,
    defaultValue: string = '',
    onChange: OnChange<FolderSetting>,
    onInit: OnInit<FolderSetting>
) => {
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]) as EnhancedLabel<HTMLInputElement>;

    const inputWrapper = div(['fred--input-group', 'fred--browse']);

    const inputEl = input(defaultValue);
    labelEl.inputEl = inputEl;

    const openFinderButton = a('', 'fred.fe.browse', '', 'fred--browse-small');

    const finderOptions: {type: string; showOnlyFolders: boolean; mediaSource?: string} = {
        type: 'folder',
        showOnlyFolders: setting.showOnlyFolders || false
    };

    if (setting.mediaSource && (setting.mediaSource !== '')) {
        finderOptions.mediaSource = setting.mediaSource;
    }

    inputEl.addEventListener('keyup', e => {
        if (typeof onChange === 'function') {
            onChange(setting.name, inputEl.value, inputEl, setting);
        }
    });

    const openFinder = e => {
        e.preventDefault();

        const finder = new Finder((folder, fm) => {
            let value = folder.url;

            if (value.indexOf(fredConfig.config.themeDir) === 0) {
                value = value.replace(fredConfig.config.themeDir, '{{theme_dir}}');
            }

            if (typeof onChange === 'function') {
                onChange(setting.name, value, inputEl, setting);
            }

            inputEl.value = value;
        }, 'fred.fe.browse_folders', finderOptions);

        finder.render();
    };

    openFinderButton.addEventListener('click', openFinder);

    inputWrapper.appendChild(inputEl);
    inputWrapper.appendChild(openFinderButton);

    labelEl.appendChild(inputWrapper);

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, inputEl);
    }

    return labelEl;
};

type ChoicesSetting = Setting & {
    choices?: {[key: string]: any}
};
export const choices = (
    setting: ChoicesSetting,
    defaultValue: string = '',
    onChange: (name: string, value: any, input: HTMLSelectElement, setting: ChoicesSetting, choices: Choices) => void,
    onInit: (setting:ChoicesSetting, label: HTMLLabelElement, input: HTMLSelectElement, choices: Choices, defaultValue: string) => void
) => {
    const wrapper = div() as HTMLDivElement & {choices: any, onError: (msg: string) => void};
    const labelEl = label(setting.label || setting.name, ['fred--label-'+setting.name]);
    const selectEl = selectElement();

    let errorEl = null;

    wrapper.appendChild(labelEl);
    wrapper.appendChild(selectEl);
    const config = setting.choices || {};
    config.searchResultLimit = 0;

    const choicesInstance = new Choices(selectEl, config);
    fixChoices(choicesInstance);

    wrapper.choices = choicesInstance;

    if (typeof onChange === 'function') {
        choicesInstance.passedElement.addEventListener('choice', (event: any) => {
            if (errorEl !== null) {
                errorEl.remove();
                errorEl = null;
            }

            onChange(setting.name, event.detail.choice, selectEl, setting, choicesInstance);
        });
    }

    wrapper.onError = msg => {
        if (errorEl === null) {
            errorEl = div('error', msg);
            labelEl.appendChild(errorEl);
        } else {
            errorEl.innerHTML = msg;
        }
    };

    if (typeof onInit === 'function') {
        onInit(setting, labelEl, selectEl, choicesInstance, defaultValue);
    }

    return wrapper;
};

type TaggerSetting = Setting & {
    group: string|number;
    limit?: number;
    autoTag?: boolean;
    hideInput?: boolean;
};
export const tagger = (
    setting: TaggerSetting,
    defaultValue: string = '',
    onChange: (name: string, value: string, field: HTMLDivElement, setting: TaggerSetting, tagger: Tagger) => void,
) => {
    setting.limit = setting.limit || 0;

    const tempField = div();

    getGroups(setting.group, setting.autoTag)
        .then(value => {
            const currentTags = defaultValue.split(',').filter(e => {return e;});
            const taggerField = new Tagger({
                id: setting.group,
                name: setting.label || setting.name,
                tag_limit: setting.limit || 0,
                field_type: 'tagger-field-tags',
                hide_input: setting.hideInput || false,
                show_autotag: setting.autoTag || false,
                allow_new: false,
                as_radio: false,
                tags: value
            }, currentTags, newTags => {
                onChange(setting.name, newTags.join(','), field, setting, taggerField);
            });

            const field = taggerField.render() as HTMLDivElement;
            if (field) {
                tempField.replaceWith(field);
            }
        })
        .catch(error => {
            emitter.emit('fred-loading', error.message);
        });

    return tempField;
};

export default {
    text,
    select,
    toggle,
    toggleGroup,
    area,
    dateTime,
    colorSwatch,
    colorPicker,
    slider,
    page,
    chunk,
    image,
    file,
    folder,
    choices,
    tagger
};

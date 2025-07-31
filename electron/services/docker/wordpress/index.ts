import validate from './validate';
import setup from './setup';
import create from './create';
import clone from './clone';
import deleteWordPress from './delete';
import utils from './utils';
import changeUrl from "./change-url.ts";

export default {
    setup,
    create,
    clone,
    delete: deleteWordPress,
    changeUrl,
    validate,
    utils,
};

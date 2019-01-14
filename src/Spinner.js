import React from 'react';
import { faGlasses, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


    const Spinner = () => (
      <div>
        <FontAwesomeIcon icon={faSpinner} /> Loading...
      </div>
    );

    export default Spinner;
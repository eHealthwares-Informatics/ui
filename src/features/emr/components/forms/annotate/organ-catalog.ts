/* Organ structure catalogue extracted from OrganUI organ components
 * (MIT, Copyright (c) 2026 OrganUI contributors). Underlying 3D models keep
 * their own CC licences; see https://organui.com/docs/licences.
 */
export type OrganStructure = { id: string; label: string; group: string | null };

export const organCatalog: Record<string, OrganStructure[]> = {
  adrenals: [
    {
      id: 'right-adrenal-gland',
      label: 'Right adrenal gland',
      group: 'Adrenal glands',
    },
    {
      id: 'left-adrenal-gland',
      label: 'Left adrenal gland',
      group: 'Adrenal glands',
    },
    {
      id: 'right-kidney',
      label: 'Right kidney',
      group: 'Neighbouring organs',
    },
    {
      id: 'left-kidney',
      label: 'Left kidney',
      group: 'Neighbouring organs',
    },
    {
      id: 'aorta',
      label: 'Aorta',
      group: 'Arteries',
    },
    {
      id: 'middle-suprarenal-arteries',
      label: 'Middle suprarenal arteries',
      group: 'Arteries',
    },
    {
      id: 'inferior-suprarenal-arteries',
      label: 'Inferior suprarenal arteries',
      group: 'Arteries',
    },
    {
      id: 'renal-arteries',
      label: 'Renal arteries',
      group: 'Arteries',
    },
    {
      id: 'right-suprarenal-vein',
      label: 'Right suprarenal vein',
      group: 'Veins',
    },
    {
      id: 'left-suprarenal-vein',
      label: 'Left suprarenal vein',
      group: 'Veins',
    },
    {
      id: 'inferior-vena-cava',
      label: 'Inferior vena cava',
      group: 'Veins',
    },
    {
      id: 'renal-veins',
      label: 'Renal veins',
      group: 'Veins',
    },
  ],
  appendix: [
    {
      id: 'appendix',
      label: 'Vermiform appendix',
      group: 'Appendix',
    },
    {
      id: 'colon',
      label: 'Cecum and ascending colon',
      group: 'Large intestine',
    },
    {
      id: 'ileum',
      label: 'Ileum',
      group: 'Small intestine',
    },
    {
      id: 'right-external-iliac-artery',
      label: 'Right external iliac artery',
      group: 'Iliac vessels',
    },
    {
      id: 'right-external-iliac-vein',
      label: 'Right external iliac vein',
      group: 'Iliac vessels',
    },
    {
      id: 'right-psoas-major',
      label: 'Right psoas major',
      group: 'Posterior abdominal wall',
    },
    {
      id: 'right-iliacus',
      label: 'Right iliacus',
      group: 'Posterior abdominal wall',
    },
  ],
  bladder: [
    {
      id: 'urinary-bladder',
      label: 'Urinary bladder',
      group: 'Urinary tract',
    },
    {
      id: 'right-ureter',
      label: 'Right ureter',
      group: 'Urinary tract',
    },
    {
      id: 'left-ureter',
      label: 'Left ureter',
      group: 'Urinary tract',
    },
    {
      id: 'urethra',
      label: 'Urethra',
      group: 'Urinary tract',
    },
    {
      id: 'prostate',
      label: 'Prostate',
      group: 'Reproductive organs',
    },
    {
      id: 'right-seminal-vesicle',
      label: 'Right seminal vesicle',
      group: 'Reproductive organs',
    },
    {
      id: 'left-seminal-vesicle',
      label: 'Left seminal vesicle',
      group: 'Reproductive organs',
    },
    {
      id: 'right-pubococcygeus',
      label: 'Right pubococcygeus',
      group: 'Pelvic floor',
    },
    {
      id: 'left-pubococcygeus',
      label: 'Left pubococcygeus',
      group: 'Pelvic floor',
    },
    {
      id: 'right-puborectalis',
      label: 'Right puborectalis',
      group: 'Pelvic floor',
    },
    {
      id: 'left-puborectalis',
      label: 'Left puborectalis',
      group: 'Pelvic floor',
    },
    {
      id: 'rectum',
      label: 'Rectum',
      group: 'Neighbouring organs',
    },
  ],
  brain: [
    {
      id: 'left-frontal',
      label: 'Left frontal lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'right-frontal',
      label: 'Right frontal lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'left-parietal',
      label: 'Left parietal lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'right-parietal',
      label: 'Right parietal lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'left-temporal',
      label: 'Left temporal lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'right-temporal',
      label: 'Right temporal lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'left-occipital',
      label: 'Left occipital lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'right-occipital',
      label: 'Right occipital lobe',
      group: 'Cerebral lobes',
    },
    {
      id: 'left-hippocampus',
      label: 'Left hippocampus',
      group: 'Deep structures',
    },
    {
      id: 'right-hippocampus',
      label: 'Right hippocampus',
      group: 'Deep structures',
    },
    {
      id: 'midbrain',
      label: 'Midbrain',
      group: 'Brainstem & cerebellum',
    },
    {
      id: 'pons',
      label: 'Pons',
      group: 'Brainstem & cerebellum',
    },
    {
      id: 'medulla',
      label: 'Medulla oblongata',
      group: 'Brainstem & cerebellum',
    },
    {
      id: 'cerebellum',
      label: 'Cerebellum',
      group: 'Brainstem & cerebellum',
    },
    {
      id: 'left-lateral-ventricle',
      label: 'Left lateral ventricle',
      group: 'Ventricular spaces',
    },
    {
      id: 'right-lateral-ventricle',
      label: 'Right lateral ventricle',
      group: 'Ventricular spaces',
    },
    {
      id: 'third-ventricle',
      label: 'Third ventricle',
      group: 'Ventricular spaces',
    },
    {
      id: 'cerebral-aqueduct',
      label: 'Cerebral aqueduct',
      group: 'Ventricular spaces',
    },
    {
      id: 'fourth-ventricle',
      label: 'Fourth ventricle',
      group: 'Ventricular spaces',
    },
  ],
  breast: [
    {
      id: 'right-fat',
      label: 'Right adipose tissue',
      group: 'Right breast',
    },
    {
      id: 'right-suspensory-ligaments',
      label: 'Right suspensory ligaments',
      group: 'Right breast',
    },
    {
      id: 'right-mammary-lobes',
      label: 'Right mammary lobes',
      group: 'Right breast',
    },
    {
      id: 'right-main-lactiferous-ducts',
      label: 'Right lactiferous ducts',
      group: 'Right breast',
    },
    {
      id: 'right-main-lactiferous-sinuses',
      label: 'Right lactiferous sinuses',
      group: 'Right breast',
    },
    {
      id: 'right-areola',
      label: 'Right areola',
      group: 'Right breast',
    },
    {
      id: 'right-areolar-tubercles',
      label: 'Right areolar tubercles',
      group: 'Right breast',
    },
    {
      id: 'right-nipple',
      label: 'Right nipple',
      group: 'Right breast',
    },
    {
      id: 'left-fat',
      label: 'Left adipose tissue',
      group: 'Left breast',
    },
    {
      id: 'left-suspensory-ligaments',
      label: 'Left suspensory ligaments',
      group: 'Left breast',
    },
    {
      id: 'left-mammary-lobes',
      label: 'Left mammary lobes',
      group: 'Left breast',
    },
    {
      id: 'left-main-lactiferous-ducts',
      label: 'Left lactiferous ducts',
      group: 'Left breast',
    },
    {
      id: 'left-main-lactiferous-sinuses',
      label: 'Left lactiferous sinuses',
      group: 'Left breast',
    },
    {
      id: 'left-areola',
      label: 'Left areola',
      group: 'Left breast',
    },
    {
      id: 'left-areolar-tubercles',
      label: 'Left areolar tubercles',
      group: 'Left breast',
    },
    {
      id: 'left-nipple',
      label: 'Left nipple',
      group: 'Left breast',
    },
  ],
  diaphragm: [
    {
      id: 'right-hemidiaphragm',
      label: 'Right hemidiaphragm',
      group: 'Diaphragm',
    },
    {
      id: 'left-hemidiaphragm',
      label: 'Left hemidiaphragm',
      group: 'Diaphragm',
    },
    {
      id: 'esophagus',
      label: 'Esophagus',
      group: 'Passing through',
    },
    {
      id: 'inferior-vena-cava',
      label: 'Inferior vena cava',
      group: 'Passing through',
    },
    {
      id: 'descending-aorta',
      label: 'Descending aorta',
      group: 'Passing through',
    },
    {
      id: 'heart',
      label: 'Heart',
      group: 'Above',
    },
    {
      id: 'right-lung-lower-lobe',
      label: 'Lower lobe of right lung',
      group: 'Above',
    },
    {
      id: 'left-lung-lower-lobe',
      label: 'Lower lobe of left lung',
      group: 'Above',
    },
    {
      id: 'liver',
      label: 'Liver',
      group: 'Below',
    },
    {
      id: 'stomach',
      label: 'Stomach',
      group: 'Below',
    },
    {
      id: 'spleen',
      label: 'Spleen',
      group: 'Below',
    },
    {
      id: 'right-psoas-major',
      label: 'Right psoas major',
      group: 'Behind',
    },
    {
      id: 'left-psoas-major',
      label: 'Left psoas major',
      group: 'Behind',
    },
  ],
  ear: [
    {
      id: 'helix',
      label: 'Helix',
      group: 'Outer ear',
    },
    {
      id: 'antihelix',
      label: 'Antihelix',
      group: 'Outer ear',
    },
    {
      id: 'scapha-and-fossa',
      label: 'Scapha and triangular fossa',
      group: 'Outer ear',
    },
    {
      id: 'concha',
      label: 'Concha',
      group: 'Outer ear',
    },
    {
      id: 'tragus',
      label: 'Tragus and antitragus',
      group: 'Outer ear',
    },
    {
      id: 'lobule',
      label: 'Lobule',
      group: 'Outer ear',
    },
    {
      id: 'back-of-auricle',
      label: 'Back of the auricle',
      group: 'Outer ear',
    },
    {
      id: 'tympanic-membrane',
      label: 'Eardrum',
      group: 'Outer ear',
    },
    {
      id: 'malleus',
      label: 'Malleus',
      group: 'Middle ear',
    },
    {
      id: 'incus',
      label: 'Incus',
      group: 'Middle ear',
    },
    {
      id: 'stapes',
      label: 'Stapes',
      group: 'Middle ear',
    },
    {
      id: 'auditory-tube',
      label: 'Auditory tube',
      group: 'Middle ear',
    },
    {
      id: 'chorda-tympani',
      label: 'Chorda tympani',
      group: 'Middle ear',
    },
    {
      id: 'cochlea',
      label: 'Cochlea',
      group: 'Inner ear',
    },
    {
      id: 'vestibule',
      label: 'Vestibule and semicircular canals',
      group: 'Inner ear',
    },
    {
      id: 'vestibulocochlear-nerve',
      label: 'Vestibulocochlear nerve',
      group: 'Inner ear',
    },
  ],
  esophagus: [
    {
      id: 'esophagus',
      label: 'Esophagus',
      group: 'Esophagus',
    },
    {
      id: 'stomach',
      label: 'Stomach',
      group: 'Neighbouring organs',
    },
    {
      id: 'trachea',
      label: 'Trachea',
      group: 'Neighbouring organs',
    },
    {
      id: 'main-bronchi',
      label: 'Main bronchi',
      group: 'Neighbouring organs',
    },
    {
      id: 'thyroid-gland',
      label: 'Thyroid gland',
      group: 'Neighbouring organs',
    },
    {
      id: 'left-atrium',
      label: 'Left atrium',
      group: 'Neighbouring organs',
    },
    {
      id: 'aortic-arch',
      label: 'Arch of aorta',
      group: 'Arteries',
    },
    {
      id: 'descending-aorta',
      label: 'Descending aorta',
      group: 'Arteries',
    },
    {
      id: 'esophageal-arteries',
      label: 'Esophageal arteries',
      group: 'Arteries',
    },
    {
      id: 'inferior-thyroid-arteries',
      label: 'Inferior thyroid arteries',
      group: 'Arteries',
    },
    {
      id: 'left-gastric-artery',
      label: 'Left gastric artery',
      group: 'Arteries',
    },
    {
      id: 'azygos-vein',
      label: 'Azygos vein',
      group: 'Veins',
    },
    {
      id: 'hemiazygos-veins',
      label: 'Hemiazygos veins',
      group: 'Veins',
    },
    {
      id: 'left-gastric-vein',
      label: 'Left gastric vein',
      group: 'Veins',
    },
    {
      id: 'right-vagus-nerve',
      label: 'Right vagus nerve',
      group: 'Nerves',
    },
    {
      id: 'left-vagus-nerve',
      label: 'Left vagus nerve',
      group: 'Nerves',
    },
    {
      id: 'recurrent-laryngeal-nerves',
      label: 'Recurrent laryngeal nerves',
      group: 'Nerves',
    },
  ],
  eye: [
    {
      id: 'cornea',
      label: 'Cornea',
      group: 'Wall of the eyeball',
    },
    {
      id: 'sclera',
      label: 'Sclera',
      group: 'Wall of the eyeball',
    },
    {
      id: 'choroid',
      label: 'Choroid',
      group: 'Wall of the eyeball',
    },
    {
      id: 'retina',
      label: 'Retina',
      group: 'Wall of the eyeball',
    },
    {
      id: 'iris',
      label: 'Iris',
      group: 'Wall of the eyeball',
    },
    {
      id: 'anterior-chamber',
      label: 'Anterior chamber',
      group: 'Inside the eyeball',
    },
    {
      id: 'lens',
      label: 'Lens',
      group: 'Inside the eyeball',
    },
    {
      id: 'suspensory-ligament',
      label: 'Suspensory ligament of lens',
      group: 'Inside the eyeball',
    },
    {
      id: 'vitreous-body',
      label: 'Vitreous body',
      group: 'Inside the eyeball',
    },
    {
      id: 'superior-rectus',
      label: 'Superior rectus',
      group: 'Eye muscles',
    },
    {
      id: 'inferior-rectus',
      label: 'Inferior rectus',
      group: 'Eye muscles',
    },
    {
      id: 'medial-rectus',
      label: 'Medial rectus',
      group: 'Eye muscles',
    },
    {
      id: 'lateral-rectus',
      label: 'Lateral rectus',
      group: 'Eye muscles',
    },
    {
      id: 'superior-oblique',
      label: 'Superior oblique',
      group: 'Eye muscles',
    },
    {
      id: 'inferior-oblique',
      label: 'Inferior oblique',
      group: 'Eye muscles',
    },
    {
      id: 'levator-palpebrae',
      label: 'Levator palpebrae superioris',
      group: 'Eye muscles',
    },
    {
      id: 'optic-nerve',
      label: 'Optic nerve',
      group: 'Nerve and eyelid',
    },
    {
      id: 'trochlea',
      label: 'Trochlea',
      group: 'Nerve and eyelid',
    },
    {
      id: 'lacrimal-gland',
      label: 'Lacrimal gland',
      group: 'Nerve and eyelid',
    },
    {
      id: 'upper-tarsal-plate',
      label: 'Upper tarsal plate',
      group: 'Nerve and eyelid',
    },
    {
      id: 'lower-tarsal-plate',
      label: 'Lower tarsal plate',
      group: 'Nerve and eyelid',
    },
  ],
  gallbladder: [
    {
      id: 'gallbladder',
      label: 'Gallbladder',
      group: 'Gallbladder',
    },
    {
      id: 'cystic-duct',
      label: 'Cystic duct',
      group: 'Bile ducts',
    },
    {
      id: 'common-hepatic-duct',
      label: 'Common hepatic duct',
      group: 'Bile ducts',
    },
    {
      id: 'right-hepatic-duct',
      label: 'Right hepatic duct',
      group: 'Bile ducts',
    },
    {
      id: 'left-hepatic-duct',
      label: 'Left hepatic duct',
      group: 'Bile ducts',
    },
    {
      id: 'intrahepatic-ducts',
      label: 'Intrahepatic bile ducts',
      group: 'Bile ducts',
    },
    {
      id: 'pancreatic-duct',
      label: 'Pancreatic duct',
      group: 'Bile ducts',
    },
    {
      id: 'liver',
      label: 'Liver',
      group: 'Neighbouring organs',
    },
    {
      id: 'duodenum',
      label: 'Duodenum',
      group: 'Neighbouring organs',
    },
    {
      id: 'pancreas',
      label: 'Pancreas',
      group: 'Neighbouring organs',
    },
    {
      id: 'portal-vein',
      label: 'Portal vein',
      group: 'Vessels',
    },
    {
      id: 'common-hepatic-artery',
      label: 'Common hepatic artery',
      group: 'Vessels',
    },
    {
      id: 'hepatic-artery-proper',
      label: 'Hepatic artery proper',
      group: 'Vessels',
    },
    {
      id: 'right-hepatic-artery',
      label: 'Right hepatic artery',
      group: 'Vessels',
    },
    {
      id: 'left-hepatic-artery',
      label: 'Left hepatic artery',
      group: 'Vessels',
    },
  ],
  hair: [
    {
      id: 'medulla',
      label: 'Medulla',
      group: 'Hair shaft',
    },
    {
      id: 'cortex',
      label: 'Cortex',
      group: 'Hair shaft',
    },
    {
      id: 'cuticle',
      label: 'Cuticle',
      group: 'Hair shaft',
    },
    {
      id: 'inner-root-sheath',
      label: 'Inner root sheath',
      group: 'Root sheaths',
    },
    {
      id: 'outer-root-sheath',
      label: 'Outer root sheath',
      group: 'Root sheaths',
    },
    {
      id: 'connective-tissue-sheath',
      label: 'Connective tissue sheath',
      group: 'Root sheaths',
    },
    {
      id: 'hair-matrix',
      label: 'Hair matrix',
      group: 'Hair bulb',
    },
    {
      id: 'dermal-papilla',
      label: 'Dermal papilla',
      group: 'Hair bulb',
    },
    {
      id: 'papilla-vessels',
      label: 'Papilla capillaries',
      group: 'Hair bulb',
    },
    {
      id: 'sebaceous-gland',
      label: 'Sebaceous gland',
      group: 'Follicle appendages',
    },
    {
      id: 'arrector-pili',
      label: 'Arrector pili muscle',
      group: 'Follicle appendages',
    },
    {
      id: 'epidermis',
      label: 'Epidermis',
      group: 'Surrounding skin',
    },
    {
      id: 'dermis',
      label: 'Dermis',
      group: 'Surrounding skin',
    },
    {
      id: 'hypodermis',
      label: 'Hypodermis',
      group: 'Surrounding skin',
    },
  ],
  heart: [
    {
      id: 'right-atrium',
      label: 'Right atrium',
      group: 'Heart walls',
    },
    {
      id: 'left-atrium',
      label: 'Left atrium',
      group: 'Heart walls',
    },
    {
      id: 'ventricular-wall',
      label: 'Ventricular wall',
      group: 'Heart walls',
    },
    {
      id: 'right-ventricle',
      label: 'Right ventricular cavity',
      group: 'Ventricular cavities',
    },
    {
      id: 'left-ventricle',
      label: 'Left ventricular cavity',
      group: 'Ventricular cavities',
    },
    {
      id: 'ascending-aorta',
      label: 'Ascending aorta',
      group: 'Great vessels',
    },
    {
      id: 'aortic-arch',
      label: 'Aortic arch',
      group: 'Great vessels',
    },
    {
      id: 'pulmonary-trunk',
      label: 'Pulmonary trunk',
      group: 'Great vessels',
    },
    {
      id: 'superior-vena-cava',
      label: 'Superior vena cava',
      group: 'Great vessels',
    },
    {
      id: 'left-coronary',
      label: 'Left coronary artery',
      group: 'Coronary arteries',
    },
    {
      id: 'right-coronary',
      label: 'Right coronary artery',
      group: 'Coronary arteries',
    },
  ],
  intestines: [
    {
      id: 'duodenum',
      label: 'Duodenum',
      group: 'Small intestine',
    },
    {
      id: 'jejunum',
      label: 'Jejunum',
      group: 'Small intestine',
    },
    {
      id: 'ileum',
      label: 'Ileum',
      group: 'Small intestine',
    },
    {
      id: 'appendix',
      label: 'Appendix',
      group: 'Large intestine',
    },
    {
      id: 'ascending-colon',
      label: 'Ascending colon',
      group: 'Large intestine',
    },
    {
      id: 'transverse-colon',
      label: 'Transverse colon',
      group: 'Large intestine',
    },
    {
      id: 'descending-colon',
      label: 'Descending colon',
      group: 'Large intestine',
    },
    {
      id: 'rectum',
      label: 'Rectum',
      group: 'Large intestine',
    },
    {
      id: 'mesocolic-taenia',
      label: 'Mesocolic taenia',
      group: 'Taeniae coli',
    },
    {
      id: 'omental-taenia',
      label: 'Omental taenia',
      group: 'Taeniae coli',
    },
    {
      id: 'free-taenia',
      label: 'Free taenia',
      group: 'Taeniae coli',
    },
  ],
  joints: [
    {
      id: 'articular-capsule-of-temporomandibular-joint',
      label: 'Articular capsule of temporomandibular joint',
      group: 'Jaw and skull base',
    },
    {
      id: 'articular-disc-of-temporomandibular-joint',
      label: 'Articular disc of temporomandibular joint',
      group: 'Jaw and skull base',
    },
    {
      id: 'lateral-temporomandibular-ligament',
      label: 'Lateral temporomandibular ligament',
      group: 'Jaw and skull base',
    },
    {
      id: 'sphenomandibular-ligament',
      label: 'Sphenomandibular ligament',
      group: 'Jaw and skull base',
    },
    {
      id: 'stylomandibular-ligament',
      label: 'Stylomandibular ligament',
      group: 'Jaw and skull base',
    },
    {
      id: 'pterygospinous-ligament',
      label: 'Pterygospinous ligament',
      group: 'Jaw and skull base',
    },
    {
      id: 'stylohyoid-ligament',
      label: 'Stylohyoid ligament',
      group: 'Jaw and skull base',
    },
    {
      id: 'median-thyrohyoid-ligament',
      label: 'Median thyrohyoid ligament',
      group: 'Larynx',
    },
    {
      id: 'lateral-thyrohyoid-ligament',
      label: 'Lateral thyrohyoid ligament',
      group: 'Larynx',
    },
    {
      id: 'quadrangular-membrane',
      label: 'Quadrangular membrane',
      group: 'Larynx',
    },
    {
      id: 'median-cricothyroid-ligament',
      label: 'Median cricothyroid ligament',
      group: 'Larynx',
    },
    {
      id: 'cricopharyngeal-ligament',
      label: 'Cricopharyngeal ligament',
      group: 'Larynx',
    },
    {
      id: 'anterior-longitudinal-ligament',
      label: 'Anterior longitudinal ligament',
      group: 'Vertebral column',
    },
    {
      id: 'posterior-longitudinal-ligament',
      label: 'Posterior longitudinal ligament',
      group: 'Vertebral column',
    },
    {
      id: 'ligamenta-flava',
      label: 'Ligamenta flava',
      group: 'Vertebral column',
    },
    {
      id: 'interspinous-ligaments',
      label: 'Interspinous ligaments',
      group: 'Vertebral column',
    },
    {
      id: 'supraspinous-ligament',
      label: 'Supraspinous ligament',
      group: 'Vertebral column',
    },
    {
      id: 'nuchal-ligament',
      label: 'Nuchal ligament',
      group: 'Vertebral column',
    },
    {
      id: 'intertransverse-ligaments',
      label: 'Intertransverse ligaments',
      group: 'Vertebral column',
    },
    {
      id: 'intercornual-ligament',
      label: 'Intercornual ligament',
      group: 'Vertebral column',
    },
    {
      id: 'cervical-intervertebral-discs',
      label: 'Cervical intervertebral discs',
      group: 'Vertebral column',
    },
    {
      id: 'thoracic-intervertebral-discs',
      label: 'Thoracic intervertebral discs',
      group: 'Vertebral column',
    },
    {
      id: 'lumbar-intervertebral-discs',
      label: 'Lumbar intervertebral discs',
      group: 'Vertebral column',
    },
    {
      id: 'sacrococcygeal-symphysis',
      label: 'Sacrococcygeal symphysis',
      group: 'Vertebral column',
    },
    {
      id: 'radiate-ligament-of-head-of-rib',
      label: 'Radiate ligament of head of rib',
      group: 'Thorax',
    },
    {
      id: 'intra-articular-ligament-of-head-of-rib',
      label: 'Intra-articular ligament of head of rib',
      group: 'Thorax',
    },
    {
      id: 'costotransverse-ligament',
      label: 'Costotransverse ligament',
      group: 'Thorax',
    },
    {
      id: 'external-intercostal-membrane',
      label: 'External intercostal membrane',
      group: 'Thorax',
    },
    {
      id: 'internal-intercostal-membrane',
      label: 'Internal intercostal membrane',
      group: 'Thorax',
    },
    {
      id: 'articular-capsule-of-sternoclavicular-joint',
      label: 'Articular capsule of sternoclavicular joint',
      group: 'Shoulder girdle',
    },
    {
      id: 'articular-disc-of-sternoclavicular-joint',
      label: 'Articular disc of sternoclavicular joint',
      group: 'Shoulder girdle',
    },
    {
      id: 'anterior-sternoclavicular-ligament',
      label: 'Anterior sternoclavicular ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'posterior-sternoclavicular-ligament',
      label: 'Posterior sternoclavicular ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'interclavicular-ligament',
      label: 'Interclavicular ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'costoclavicular-ligament',
      label: 'Costoclavicular ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'articular-capsule-of-acromioclavicular-joint',
      label: 'Articular capsule of acromioclavicular joint',
      group: 'Shoulder girdle',
    },
    {
      id: 'articular-disc-of-acromioclavicular-joint',
      label: 'Articular disc of acromioclavicular joint',
      group: 'Shoulder girdle',
    },
    {
      id: 'acromioclavicular-ligament',
      label: 'Acromioclavicular ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'conoid-ligament',
      label: 'Conoid ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'trapezoid-ligament',
      label: 'Trapezoid ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'coraco-acromial-ligament',
      label: 'Coraco-acromial ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'superior-transverse-scapular-ligament',
      label: 'Superior transverse scapular ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'inferior-transverse-scapular-ligament',
      label: 'Inferior transverse scapular ligament',
      group: 'Shoulder girdle',
    },
    {
      id: 'articular-capsule-of-glenohumeral-joint',
      label: 'Articular capsule of glenohumeral joint',
      group: 'Shoulder',
    },
    {
      id: 'glenoid-labrum',
      label: 'Glenoid labrum',
      group: 'Shoulder',
    },
    {
      id: 'superior-glenohumeral-ligament',
      label: 'Superior glenohumeral ligament',
      group: 'Shoulder',
    },
    {
      id: 'middle-glenohumeral-ligament',
      label: 'Middle glenohumeral ligament',
      group: 'Shoulder',
    },
    {
      id: 'inferior-glenohumeral-ligament',
      label: 'Inferior glenohumeral ligament',
      group: 'Shoulder',
    },
    {
      id: 'coracohumeral-ligament',
      label: 'Coracohumeral ligament',
      group: 'Shoulder',
    },
    {
      id: 'transverse-humeral-ligament',
      label: 'Transverse humeral ligament',
      group: 'Shoulder',
    },
    {
      id: 'articular-capsule-of-elbow-joint',
      label: 'Articular capsule of elbow joint',
      group: 'Elbow and forearm',
    },
    {
      id: 'ulnar-collateral-ligament',
      label: 'Ulnar collateral ligament',
      group: 'Elbow and forearm',
    },
    {
      id: 'radial-collateral-ligament',
      label: 'Radial collateral ligament',
      group: 'Elbow and forearm',
    },
    {
      id: 'annular-ligament-of-radius',
      label: 'Annular ligament of radius',
      group: 'Elbow and forearm',
    },
    {
      id: 'quadrate-ligament',
      label: 'Quadrate ligament',
      group: 'Elbow and forearm',
    },
    {
      id: 'interosseous-membrane-of-forearm',
      label: 'Interosseous membrane of forearm',
      group: 'Elbow and forearm',
    },
    {
      id: 'oblique-cord',
      label: 'Oblique cord',
      group: 'Elbow and forearm',
    },
    {
      id: 'articular-disc-of-distal-radio-ulnar-joint',
      label: 'Articular disc of distal radio-ulnar joint',
      group: 'Wrist',
    },
    {
      id: 'palmar-radio-ulnar-ligament',
      label: 'Palmar radio-ulnar ligament',
      group: 'Wrist',
    },
    {
      id: 'dorsal-radio-ulnar-ligament',
      label: 'Dorsal radio-ulnar ligament',
      group: 'Wrist',
    },
    {
      id: 'articular-capsule-of-radiocarpal-joint',
      label: 'Articular capsule of radiocarpal joint',
      group: 'Wrist',
    },
    {
      id: 'radial-collateral-ligament-of-wrist-joint',
      label: 'Radial collateral ligament of wrist joint',
      group: 'Wrist',
    },
    {
      id: 'ulnar-collateral-ligament-of-wrist-joint',
      label: 'Ulnar collateral ligament of wrist joint',
      group: 'Wrist',
    },
    {
      id: 'dorsal-radiocarpal-ligament',
      label: 'Dorsal radiocarpal ligament',
      group: 'Wrist',
    },
    {
      id: 'radioscaphocapitate-ligament',
      label: 'Radioscaphocapitate ligament',
      group: 'Wrist',
    },
    {
      id: 'radiocapitate-ligament',
      label: 'Radiocapitate ligament',
      group: 'Wrist',
    },
    {
      id: 'ulnolunate-ligament',
      label: 'Ulnolunate ligament',
      group: 'Wrist',
    },
    {
      id: 'ulnotriquetral-ligament',
      label: 'Ulnotriquetral ligament',
      group: 'Wrist',
    },
    {
      id: 'ulnocapitate-ligament',
      label: 'Ulnocapitate ligament',
      group: 'Wrist',
    },
    {
      id: 'ulnopisiform-ligament',
      label: 'Ulnopisiform ligament',
      group: 'Wrist',
    },
    {
      id: 'dorsal-ulnocarpal-ligament',
      label: 'Dorsal ulnocarpal ligament',
      group: 'Wrist',
    },
    {
      id: 'radiate-carpal-ligament',
      label: 'Radiate carpal ligament',
      group: 'Wrist',
    },
    {
      id: 'dorsal-intercarpal-ligaments',
      label: 'Dorsal intercarpal ligaments',
      group: 'Wrist',
    },
    {
      id: 'dorsal-scaphotriquetral-ligament',
      label: 'Dorsal scaphotriquetral ligament',
      group: 'Wrist',
    },
    {
      id: 'palmar-scaphotriquetral-ligament',
      label: 'Palmar scaphotriquetral ligament',
      group: 'Wrist',
    },
    {
      id: 'scapholunate-interosseous-ligament',
      label: 'Scapholunate interosseous ligament',
      group: 'Wrist',
    },
    {
      id: 'lunotriquetral-interosseous-ligament',
      label: 'Lunotriquetral interosseous ligament',
      group: 'Wrist',
    },
    {
      id: 'palmar-lunotriquetral-ligament',
      label: 'Palmar lunotriquetral ligament',
      group: 'Wrist',
    },
    {
      id: 'scaphocapitate-ligament',
      label: 'Scaphocapitate ligament',
      group: 'Wrist',
    },
    {
      id: 'triquetrocapitate-ligament',
      label: 'Triquetrocapitate ligament',
      group: 'Wrist',
    },
    {
      id: 'triquetrohamate-ligament',
      label: 'Triquetrohamate ligament',
      group: 'Wrist',
    },
    {
      id: 'scaphotrapeziotrapezoidal-ligament',
      label: 'Scaphotrapeziotrapezoidal ligament',
      group: 'Wrist',
    },
    {
      id: 'trapeziotrapezoidal-interosseous-ligament',
      label: 'Trapeziotrapezoidal interosseous ligament',
      group: 'Wrist',
    },
    {
      id: 'trapezoideocapitate-interosseous-ligament',
      label: 'Trapezoideocapitate interosseous ligament',
      group: 'Wrist',
    },
    {
      id: 'palmar-trapezoideocapitate-ligament',
      label: 'Palmar trapezoideocapitate ligament',
      group: 'Wrist',
    },
    {
      id: 'capitohamate-interosseous-ligament',
      label: 'Capitohamate interosseous ligament',
      group: 'Wrist',
    },
    {
      id: 'palmar-capitohamate-ligament',
      label: 'Palmar capitohamate ligament',
      group: 'Wrist',
    },
    {
      id: 'pisotriquetral-ligament',
      label: 'Pisotriquetral ligament',
      group: 'Wrist',
    },
    {
      id: 'pisohamate-ligament',
      label: 'Pisohamate ligament',
      group: 'Wrist',
    },
    {
      id: 'pisometacarpal-ligament',
      label: 'Pisometacarpal ligament',
      group: 'Wrist',
    },
    {
      id: 'palmar-carpometacarpal-ligaments',
      label: 'Palmar carpometacarpal ligaments',
      group: 'Hand',
    },
    {
      id: 'dorsal-carpometacarpal-ligaments',
      label: 'Dorsal carpometacarpal ligaments',
      group: 'Hand',
    },
    {
      id: 'palmar-metacarpal-ligaments',
      label: 'Palmar metacarpal ligaments',
      group: 'Hand',
    },
    {
      id: 'dorsal-metacarpal-ligaments',
      label: 'Dorsal metacarpal ligaments',
      group: 'Hand',
    },
    {
      id: 'interosseous-metacarpal-ligaments',
      label: 'Interosseous metacarpal ligaments',
      group: 'Hand',
    },
    {
      id: 'articular-capsules-of-metacarpophalangeal-joints',
      label: 'Articular capsules of metacarpophalangeal joints',
      group: 'Hand',
    },
    {
      id: 'collateral-metacarpophalangeal-ligaments',
      label: 'Collateral metacarpophalangeal ligaments',
      group: 'Hand',
    },
    {
      id: 'deep-transverse-metacarpal-ligament',
      label: 'Deep transverse metacarpal ligament',
      group: 'Hand',
    },
    {
      id: 'articular-capsules-of-proximal-interphalangeal-joints',
      label: 'Articular capsules of proximal interphalangeal joints',
      group: 'Hand',
    },
    {
      id: 'articular-capsules-of-distal-interphalangeal-joints',
      label: 'Articular capsules of distal interphalangeal joints',
      group: 'Hand',
    },
    {
      id: 'collateral-interphalangeal-ligaments-of-hand',
      label: 'Collateral interphalangeal ligaments of hand',
      group: 'Hand',
    },
    {
      id: 'palmar-interphalangeal-ligaments',
      label: 'Palmar interphalangeal ligaments',
      group: 'Hand',
    },
    {
      id: 'anterior-sacro-iliac-ligament',
      label: 'Anterior sacro-iliac ligament',
      group: 'Pelvis',
    },
    {
      id: 'interosseous-sacro-iliac-ligament',
      label: 'Interosseous sacro-iliac ligament',
      group: 'Pelvis',
    },
    {
      id: 'posterior-sacro-iliac-ligament',
      label: 'Posterior sacro-iliac ligament',
      group: 'Pelvis',
    },
    {
      id: 'iliolumbar-ligament',
      label: 'Iliolumbar ligament',
      group: 'Pelvis',
    },
    {
      id: 'sacrotuberous-ligament',
      label: 'Sacrotuberous ligament',
      group: 'Pelvis',
    },
    {
      id: 'sacrospinous-ligament',
      label: 'Sacrospinous ligament',
      group: 'Pelvis',
    },
    {
      id: 'obturator-membrane',
      label: 'Obturator membrane',
      group: 'Pelvis',
    },
    {
      id: 'pubic-symphysis',
      label: 'Pubic symphysis',
      group: 'Pelvis',
    },
    {
      id: 'superior-pubic-ligament',
      label: 'Superior pubic ligament',
      group: 'Pelvis',
    },
    {
      id: 'inferior-pubic-ligament',
      label: 'Inferior pubic ligament',
      group: 'Pelvis',
    },
    {
      id: 'articular-capsule-of-hip-joint',
      label: 'Articular capsule of hip joint',
      group: 'Hip',
    },
    {
      id: 'acetabular-labrum',
      label: 'Acetabular labrum',
      group: 'Hip',
    },
    {
      id: 'transverse-acetabular-ligament',
      label: 'Transverse acetabular ligament',
      group: 'Hip',
    },
    {
      id: 'ligament-of-head-of-femur',
      label: 'Ligament of head of femur',
      group: 'Hip',
    },
    {
      id: 'descending-part-of-iliofemoral-ligament',
      label: 'Descending part of iliofemoral ligament',
      group: 'Hip',
    },
    {
      id: 'transverse-part-of-iliofemoral-ligament',
      label: 'Transverse part of iliofemoral ligament',
      group: 'Hip',
    },
    {
      id: 'pubofemoral-ligament',
      label: 'Pubofemoral ligament',
      group: 'Hip',
    },
    {
      id: 'ischiofemoral-ligament',
      label: 'Ischiofemoral ligament',
      group: 'Hip',
    },
    {
      id: 'zona-orbicularis',
      label: 'Zona orbicularis',
      group: 'Hip',
    },
    {
      id: 'frenula-capsulae',
      label: 'Frenula capsulae',
      group: 'Hip',
    },
    {
      id: 'articular-capsule-of-knee-joint',
      label: 'Articular capsule of knee joint',
      group: 'Knee',
    },
    {
      id: 'anterior-cruciate-ligament',
      label: 'Anterior cruciate ligament',
      group: 'Knee',
    },
    {
      id: 'posterior-cruciate-ligament',
      label: 'Posterior cruciate ligament',
      group: 'Knee',
    },
    {
      id: 'medial-meniscus',
      label: 'Medial meniscus',
      group: 'Knee',
    },
    {
      id: 'lateral-meniscus',
      label: 'Lateral meniscus',
      group: 'Knee',
    },
    {
      id: 'transverse-ligament-of-knee',
      label: 'Transverse ligament of knee',
      group: 'Knee',
    },
    {
      id: 'anterior-meniscotibial-ligament-medial-meniscus',
      label: 'Anterior meniscotibial ligament (medial meniscus)',
      group: 'Knee',
    },
    {
      id: 'posterior-meniscotibial-ligament-medial-meniscus',
      label: 'Posterior meniscotibial ligament (medial meniscus)',
      group: 'Knee',
    },
    {
      id: 'anterior-meniscotibial-ligament-lateral-meniscus',
      label: 'Anterior meniscotibial ligament (lateral meniscus)',
      group: 'Knee',
    },
    {
      id: 'posterior-meniscotibial-ligament-lateral-meniscus',
      label: 'Posterior meniscotibial ligament (lateral meniscus)',
      group: 'Knee',
    },
    {
      id: 'superficial-part-of-tibial-collateral-ligament',
      label: 'Superficial part of tibial collateral ligament',
      group: 'Knee',
    },
    {
      id: 'deep-part-of-tibial-collateral-ligament',
      label: 'Deep part of tibial collateral ligament',
      group: 'Knee',
    },
    {
      id: 'fibular-collateral-ligament',
      label: 'Fibular collateral ligament',
      group: 'Knee',
    },
    {
      id: 'oblique-popliteal-ligament',
      label: 'Oblique popliteal ligament',
      group: 'Knee',
    },
    {
      id: 'arcuate-popliteal-ligament',
      label: 'Arcuate popliteal ligament',
      group: 'Knee',
    },
    {
      id: 'popliteofibular-ligament',
      label: 'Popliteofibular ligament',
      group: 'Knee',
    },
    {
      id: 'meniscopatellar-ligament',
      label: 'Meniscopatellar ligament',
      group: 'Knee',
    },
    {
      id: 'infrapatellar-fat-pad',
      label: 'Infrapatellar fat pad',
      group: 'Knee',
    },
    {
      id: 'articular-capsule-of-superior-tibiofibular-joint',
      label: 'Articular capsule of superior tibiofibular joint',
      group: 'Knee',
    },
    {
      id: 'anterior-ligament-of-fibular-head',
      label: 'Anterior ligament of fibular head',
      group: 'Knee',
    },
    {
      id: 'posterior-ligament-of-fibular-head',
      label: 'Posterior ligament of fibular head',
      group: 'Knee',
    },
    {
      id: 'interosseous-membrane-of-leg',
      label: 'Interosseous membrane of leg',
      group: 'Leg and ankle',
    },
    {
      id: 'anterior-tibiofibular-ligament',
      label: 'Anterior tibiofibular ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'posterior-tibiofibular-ligament',
      label: 'Posterior tibiofibular ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'transverse-tibiofibular-ligament',
      label: 'Transverse tibiofibular ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'anterior-talofibular-ligament',
      label: 'Anterior talofibular ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'calcaneofibular-ligament',
      label: 'Calcaneofibular ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'posterior-talofibular-ligament',
      label: 'Posterior talofibular ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'tibionavicular-ligament',
      label: 'Tibionavicular ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'tibiocalcaneal-ligament',
      label: 'Tibiocalcaneal ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'posterior-tibiotalar-ligament',
      label: 'Posterior tibiotalar ligament',
      group: 'Leg and ankle',
    },
    {
      id: 'talocalcaneal-interosseous-ligament',
      label: 'Talocalcaneal interosseous ligament',
      group: 'Foot',
    },
    {
      id: 'anterior-talocalcaneal-ligament',
      label: 'Anterior talocalcaneal ligament',
      group: 'Foot',
    },
    {
      id: 'lateral-talocalcaneal-ligament',
      label: 'Lateral talocalcaneal ligament',
      group: 'Foot',
    },
    {
      id: 'medial-talocalcaneal-ligament',
      label: 'Medial talocalcaneal ligament',
      group: 'Foot',
    },
    {
      id: 'posterior-talocalcaneal-ligament',
      label: 'Posterior talocalcaneal ligament',
      group: 'Foot',
    },
    {
      id: 'talonavicular-ligament',
      label: 'Talonavicular ligament',
      group: 'Foot',
    },
    {
      id: 'plantar-calcaneonavicular-ligament',
      label: 'Plantar calcaneonavicular ligament',
      group: 'Foot',
    },
    {
      id: 'calcaneonavicular-ligament',
      label: 'Calcaneonavicular ligament',
      group: 'Foot',
    },
    {
      id: 'calcaneocuboid-ligament',
      label: 'Calcaneocuboid ligament',
      group: 'Foot',
    },
    {
      id: 'dorsal-calcaneocuboid-ligament',
      label: 'Dorsal calcaneocuboid ligament',
      group: 'Foot',
    },
    {
      id: 'plantar-calcaneocuboid-ligament',
      label: 'Plantar calcaneocuboid ligament',
      group: 'Foot',
    },
    {
      id: 'long-plantar-ligament',
      label: 'Long plantar ligament',
      group: 'Foot',
    },
    {
      id: 'dorsal-cuboideonavicular-ligament',
      label: 'Dorsal cuboideonavicular ligament',
      group: 'Foot',
    },
    {
      id: 'plantar-cuboideonavicular-ligament',
      label: 'Plantar cuboideonavicular ligament',
      group: 'Foot',
    },
    {
      id: 'dorsal-cuneonavicular-ligaments',
      label: 'Dorsal cuneonavicular ligaments',
      group: 'Foot',
    },
    {
      id: 'plantar-cuneonavicular-ligaments',
      label: 'Plantar cuneonavicular ligaments',
      group: 'Foot',
    },
    {
      id: 'dorsal-intercuneiform-ligaments',
      label: 'Dorsal intercuneiform ligaments',
      group: 'Foot',
    },
    {
      id: 'plantar-intercuneiform-ligaments',
      label: 'Plantar intercuneiform ligaments',
      group: 'Foot',
    },
    {
      id: 'intercuneiform-interosseous-ligaments',
      label: 'Intercuneiform interosseous ligaments',
      group: 'Foot',
    },
    {
      id: 'dorsal-cuneocuboid-ligament',
      label: 'Dorsal cuneocuboid ligament',
      group: 'Foot',
    },
    {
      id: 'plantar-cuneocuboid-ligament',
      label: 'Plantar cuneocuboid ligament',
      group: 'Foot',
    },
    {
      id: 'cuneocuboid-interosseous-ligament',
      label: 'Cuneocuboid interosseous ligament',
      group: 'Foot',
    },
    {
      id: 'dorsal-tarsometatarsal-ligaments',
      label: 'Dorsal tarsometatarsal ligaments',
      group: 'Foot',
    },
    {
      id: 'plantar-tarsometatarsal-ligaments',
      label: 'Plantar tarsometatarsal ligaments',
      group: 'Foot',
    },
    {
      id: 'cuneometatarsal-interosseous-ligaments',
      label: 'Cuneometatarsal interosseous ligaments',
      group: 'Foot',
    },
    {
      id: 'dorsal-metatarsal-ligaments',
      label: 'Dorsal metatarsal ligaments',
      group: 'Foot',
    },
    {
      id: 'plantar-metatarsal-ligaments',
      label: 'Plantar metatarsal ligaments',
      group: 'Foot',
    },
    {
      id: 'metatarsal-interosseous-ligaments',
      label: 'Metatarsal interosseous ligaments',
      group: 'Foot',
    },
    {
      id: 'intersesamoid-ligament',
      label: 'Intersesamoid ligament',
      group: 'Foot',
    },
    {
      id: 'articular-capsules-of-metatarsophalangeal-joints',
      label: 'Articular capsules of metatarsophalangeal joints',
      group: 'Foot',
    },
    {
      id: 'collateral-metatarsophalangeal-ligaments',
      label: 'Collateral metatarsophalangeal ligaments',
      group: 'Foot',
    },
    {
      id: 'plantar-metatarsophalangeal-ligaments',
      label: 'Plantar metatarsophalangeal ligaments',
      group: 'Foot',
    },
    {
      id: 'deep-transverse-metatarsal-ligament',
      label: 'Deep transverse metatarsal ligament',
      group: 'Foot',
    },
    {
      id: 'articular-capsule-of-interphalangeal-joint-of-great-toe',
      label: 'Articular capsule of interphalangeal joint of great toe',
      group: 'Foot',
    },
    {
      id: 'articular-capsules-of-proximal-interphalangeal-joints-of-foot',
      label: 'Articular capsules of proximal interphalangeal joints of foot',
      group: 'Foot',
    },
    {
      id: 'articular-capsules-of-distal-interphalangeal-joints-of-foot',
      label: 'Articular capsules of distal interphalangeal joints of foot',
      group: 'Foot',
    },
    {
      id: 'collateral-interphalangeal-ligaments-of-foot',
      label: 'Collateral interphalangeal ligaments of foot',
      group: 'Foot',
    },
    {
      id: 'plantar-interphalangeal-ligaments',
      label: 'Plantar interphalangeal ligaments',
      group: 'Foot',
    },
    {
      id: 'skull-hyoid-and-larynx',
      label: 'Skull, hyoid and larynx',
      group: 'Bones',
    },
    {
      id: 'vertebrae',
      label: 'Vertebrae',
      group: 'Bones',
    },
    {
      id: 'thoracic-cage',
      label: 'Thoracic cage',
      group: 'Bones',
    },
    {
      id: 'bones-of-shoulder-girdle-and-arm',
      label: 'Bones of shoulder girdle and arm',
      group: 'Bones',
    },
    {
      id: 'hip-bones',
      label: 'Hip bones',
      group: 'Bones',
    },
    {
      id: 'bones-of-leg-and-foot',
      label: 'Bones of leg and foot',
      group: 'Bones',
    },
  ],
  kidneys: [
    {
      id: 'right-kidney',
      label: 'Right kidney',
      group: 'Kidneys',
    },
    {
      id: 'left-kidney',
      label: 'Left kidney',
      group: 'Kidneys',
    },
    {
      id: 'right-ureter',
      label: 'Right ureter',
      group: 'Urinary tract',
    },
    {
      id: 'left-ureter',
      label: 'Left ureter',
      group: 'Urinary tract',
    },
    {
      id: 'right-renal-artery',
      label: 'Right renal artery',
      group: 'Arterial supply',
    },
    {
      id: 'left-renal-artery',
      label: 'Left renal artery',
      group: 'Arterial supply',
    },
  ],
  larynx: [
    {
      id: 'hyoid-bone',
      label: 'Hyoid bone',
      group: 'Cartilages and bone',
    },
    {
      id: 'thyroid-cartilage',
      label: 'Thyroid cartilage',
      group: 'Cartilages and bone',
    },
    {
      id: 'cricoid-cartilage',
      label: 'Cricoid cartilage',
      group: 'Cartilages and bone',
    },
    {
      id: 'epiglottis',
      label: 'Epiglottis',
      group: 'Cartilages and bone',
    },
    {
      id: 'arytenoid-cartilages',
      label: 'Arytenoid cartilages',
      group: 'Cartilages and bone',
    },
    {
      id: 'corniculate-cuneiform-cartilages',
      label: 'Corniculate and cuneiform cartilages',
      group: 'Cartilages and bone',
    },
    {
      id: 'thyrohyoid-membrane',
      label: 'Thyrohyoid membrane',
      group: 'Ligaments and membranes',
    },
    {
      id: 'cricothyroid-ligament',
      label: 'Median cricothyroid ligament',
      group: 'Ligaments and membranes',
    },
    {
      id: 'conus-elasticus',
      label: 'Conus elasticus',
      group: 'Ligaments and membranes',
    },
    {
      id: 'vocal-ligaments',
      label: 'Vocal ligaments',
      group: 'Ligaments and membranes',
    },
    {
      id: 'epiglottic-ligaments',
      label: 'Epiglottic ligaments',
      group: 'Ligaments and membranes',
    },
    {
      id: 'cricothyroid-muscle',
      label: 'Cricothyroid',
      group: 'Muscles',
    },
    {
      id: 'posterior-crico-arytenoid',
      label: 'Posterior crico-arytenoid',
      group: 'Muscles',
    },
    {
      id: 'lateral-crico-arytenoid',
      label: 'Lateral crico-arytenoid',
      group: 'Muscles',
    },
    {
      id: 'arytenoid-muscles',
      label: 'Arytenoid muscles',
      group: 'Muscles',
    },
    {
      id: 'thyro-arytenoid',
      label: 'Thyro-arytenoid',
      group: 'Muscles',
    },
    {
      id: 'vocalis',
      label: 'Vocalis',
      group: 'Muscles',
    },
    {
      id: 'aryepiglottic-muscle',
      label: 'Aryepiglottic',
      group: 'Muscles',
    },
    {
      id: 'trachea',
      label: 'Trachea',
      group: 'Airway',
    },
    {
      id: 'thyroid-gland',
      label: 'Thyroid gland',
      group: 'Neighbouring organs',
    },
  ],
  liver: [
    {
      id: 'liver',
      label: 'Liver surface',
      group: 'Liver',
    },
    {
      id: 'gallbladder',
      label: 'Gallbladder',
      group: 'Biliary system',
    },
    {
      id: 'portal',
      label: 'Portal vein',
      group: 'Blood vessels',
    },
    {
      id: 'hepatic-veins',
      label: 'Hepatic veins',
      group: 'Blood vessels',
    },
    {
      id: 'artery',
      label: 'Hepatic artery',
      group: 'Blood vessels',
    },
    {
      id: 'biliary',
      label: 'Hepatic bile ducts',
      group: 'Biliary system',
    },
    {
      id: 'cystic',
      label: 'Cystic duct',
      group: 'Biliary system',
    },
  ],
  lungs: [
    {
      id: 'FMA7338',
      label: 'Right apical segment',
      group: 'Right upper lobe',
    },
    {
      id: 'FMA7339',
      label: 'Right posterior segment',
      group: 'Right upper lobe',
    },
    {
      id: 'FMA7359',
      label: 'Right anterior segment',
      group: 'Right upper lobe',
    },
    {
      id: 'FMA7361',
      label: 'Right lateral segment',
      group: 'Right middle lobe',
    },
    {
      id: 'FMA7360',
      label: 'Right medial segment',
      group: 'Right middle lobe',
    },
    {
      id: 'FMA7366',
      label: 'Right superior segment',
      group: 'Right lower lobe',
    },
    {
      id: 'FMA7364',
      label: 'Right anterior basal segment',
      group: 'Right lower lobe',
    },
    {
      id: 'FMA7363',
      label: 'Right lateral basal segment',
      group: 'Right lower lobe',
    },
    {
      id: 'FMA7362',
      label: 'Right posterior basal segment',
      group: 'Right lower lobe',
    },
    {
      id: 'FMA7372',
      label: 'Left apicoposterior segment',
      group: 'Left upper lobe',
    },
    {
      id: 'FMA7373',
      label: 'Left anterior segment',
      group: 'Left upper lobe',
    },
    {
      id: 'FMA7374',
      label: 'Superior lingular segment',
      group: 'Left upper lobe',
    },
    {
      id: 'FMA7375',
      label: 'Inferior lingular segment',
      group: 'Left upper lobe',
    },
    {
      id: 'FMA7376',
      label: 'Left superior segment',
      group: 'Left lower lobe',
    },
    {
      id: 'FMA7378',
      label: 'Left anterior basal segment',
      group: 'Left lower lobe',
    },
    {
      id: 'FMA7379',
      label: 'Left lateral basal segment',
      group: 'Left lower lobe',
    },
    {
      id: 'FMA7380',
      label: 'Left posterior basal segment',
      group: 'Left lower lobe',
    },
    {
      id: 'FMA7394',
      label: 'Trachea',
      group: 'Airway tree',
    },
    {
      id: 'FMA26661',
      label: 'Right bronchial tree',
      group: 'Airway tree',
    },
    {
      id: 'FMA26662',
      label: 'Left bronchial tree',
      group: 'Airway tree',
    },
  ],
  lymph: [
    {
      id: 'capsule',
      label: 'Capsule',
      group: 'Lymph node',
    },
    {
      id: 'follicles',
      label: 'Follicles',
      group: 'Lymph node',
    },
    {
      id: 'paracortex',
      label: 'Paracortex',
      group: 'Lymph node',
    },
    {
      id: 'medulla',
      label: 'Medulla',
      group: 'Lymph node',
    },
    {
      id: 'afferent-vessels',
      label: 'Afferent lymphatic vessels',
      group: 'Lymphatic vessels',
    },
    {
      id: 'efferent-vessel',
      label: 'Efferent lymphatic vessel',
      group: 'Lymphatic vessels',
    },
    {
      id: 'blood-vessels',
      label: 'Blood vessels',
      group: 'Blood vessels',
    },
  ],
  muscles: [
    {
      id: 'frontalis',
      label: 'Frontalis',
      group: 'Face and scalp',
    },
    {
      id: 'occipitalis',
      label: 'Occipitalis',
      group: 'Face and scalp',
    },
    {
      id: 'epicranial-aponeurosis',
      label: 'Epicranial aponeurosis',
      group: 'Face and scalp',
    },
    {
      id: 'temporoparietalis',
      label: 'Temporoparietalis',
      group: 'Face and scalp',
    },
    {
      id: 'orbicularis-oculi',
      label: 'Orbicularis oculi',
      group: 'Face and scalp',
    },
    {
      id: 'corrugator-supercilii',
      label: 'Corrugator supercilii',
      group: 'Face and scalp',
    },
    {
      id: 'procerus',
      label: 'Procerus',
      group: 'Face and scalp',
    },
    {
      id: 'nasalis',
      label: 'Nasalis',
      group: 'Face and scalp',
    },
    {
      id: 'depressor-septi-nasi',
      label: 'Depressor septi nasi',
      group: 'Face and scalp',
    },
    {
      id: 'levator-labii-superioris-alaeque-nasi',
      label: 'Levator labii superioris alaeque nasi',
      group: 'Face and scalp',
    },
    {
      id: 'levator-labii-superioris',
      label: 'Levator labii superioris',
      group: 'Face and scalp',
    },
    {
      id: 'zygomaticus-minor',
      label: 'Zygomaticus minor',
      group: 'Face and scalp',
    },
    {
      id: 'zygomaticus-major',
      label: 'Zygomaticus major',
      group: 'Face and scalp',
    },
    {
      id: 'levator-anguli-oris',
      label: 'Levator anguli oris',
      group: 'Face and scalp',
    },
    {
      id: 'risorius',
      label: 'Risorius',
      group: 'Face and scalp',
    },
    {
      id: 'orbicularis-oris',
      label: 'Orbicularis oris',
      group: 'Face and scalp',
    },
    {
      id: 'buccinator',
      label: 'Buccinator',
      group: 'Face and scalp',
    },
    {
      id: 'depressor-anguli-oris',
      label: 'Depressor anguli oris',
      group: 'Face and scalp',
    },
    {
      id: 'depressor-labii-inferioris',
      label: 'Depressor labii inferioris',
      group: 'Face and scalp',
    },
    {
      id: 'mentalis',
      label: 'Mentalis',
      group: 'Face and scalp',
    },
    {
      id: 'masseter',
      label: 'Masseter',
      group: 'Chewing',
    },
    {
      id: 'temporalis',
      label: 'Temporalis',
      group: 'Chewing',
    },
    {
      id: 'medial-pterygoid',
      label: 'Medial pterygoid',
      group: 'Chewing',
    },
    {
      id: 'lateral-pterygoid',
      label: 'Lateral pterygoid',
      group: 'Chewing',
    },
    {
      id: 'platysma',
      label: 'Platysma',
      group: 'Neck',
    },
    {
      id: 'sternocleidomastoid',
      label: 'Sternocleidomastoid',
      group: 'Neck',
    },
    {
      id: 'digastric',
      label: 'Digastric',
      group: 'Neck',
    },
    {
      id: 'stylohyoid',
      label: 'Stylohyoid',
      group: 'Neck',
    },
    {
      id: 'mylohyoid',
      label: 'Mylohyoid',
      group: 'Neck',
    },
    {
      id: 'geniohyoid',
      label: 'Geniohyoid',
      group: 'Neck',
    },
    {
      id: 'sternohyoid',
      label: 'Sternohyoid',
      group: 'Neck',
    },
    {
      id: 'omohyoid',
      label: 'Omohyoid',
      group: 'Neck',
    },
    {
      id: 'sternothyroid',
      label: 'Sternothyroid',
      group: 'Neck',
    },
    {
      id: 'thyrohyoid',
      label: 'Thyrohyoid',
      group: 'Neck',
    },
    {
      id: 'scalenus-anterior',
      label: 'Scalenus anterior',
      group: 'Neck',
    },
    {
      id: 'scalenus-medius',
      label: 'Scalenus medius',
      group: 'Neck',
    },
    {
      id: 'scalenus-posterior',
      label: 'Scalenus posterior',
      group: 'Neck',
    },
    {
      id: 'longus-colli',
      label: 'Longus colli',
      group: 'Neck',
    },
    {
      id: 'longus-capitis',
      label: 'Longus capitis',
      group: 'Neck',
    },
    {
      id: 'rectus-capitis-anterior',
      label: 'Rectus capitis anterior',
      group: 'Neck',
    },
    {
      id: 'rectus-capitis-lateralis',
      label: 'Rectus capitis lateralis',
      group: 'Neck',
    },
    {
      id: 'trapezius',
      label: 'Trapezius',
      group: 'Back',
    },
    {
      id: 'latissimus-dorsi',
      label: 'Latissimus dorsi',
      group: 'Back',
    },
    {
      id: 'levator-scapulae',
      label: 'Levator scapulae',
      group: 'Back',
    },
    {
      id: 'rhomboid-major',
      label: 'Rhomboid major',
      group: 'Back',
    },
    {
      id: 'rhomboid-minor',
      label: 'Rhomboid minor',
      group: 'Back',
    },
    {
      id: 'serratus-posterior-superior',
      label: 'Serratus posterior superior',
      group: 'Back',
    },
    {
      id: 'serratus-posterior-inferior',
      label: 'Serratus posterior inferior',
      group: 'Back',
    },
    {
      id: 'splenius-capitis',
      label: 'Splenius capitis',
      group: 'Back',
    },
    {
      id: 'splenius-cervicis',
      label: 'Splenius cervicis',
      group: 'Back',
    },
    {
      id: 'iliocostalis',
      label: 'Iliocostalis',
      group: 'Back',
    },
    {
      id: 'longissimus',
      label: 'Longissimus',
      group: 'Back',
    },
    {
      id: 'spinalis',
      label: 'Spinalis',
      group: 'Back',
    },
    {
      id: 'semispinalis',
      label: 'Semispinalis',
      group: 'Back',
    },
    {
      id: 'multifidus',
      label: 'Multifidus',
      group: 'Back',
    },
    {
      id: 'rotatores',
      label: 'Rotatores',
      group: 'Back',
    },
    {
      id: 'interspinales',
      label: 'Interspinales',
      group: 'Back',
    },
    {
      id: 'intertransversarii',
      label: 'Intertransversarii',
      group: 'Back',
    },
    {
      id: 'levatores-costarum',
      label: 'Levatores costarum',
      group: 'Back',
    },
    {
      id: 'rectus-capitis-posterior-major',
      label: 'Rectus capitis posterior major',
      group: 'Back',
    },
    {
      id: 'rectus-capitis-posterior-minor',
      label: 'Rectus capitis posterior minor',
      group: 'Back',
    },
    {
      id: 'obliquus-capitis-superior',
      label: 'Obliquus capitis superior',
      group: 'Back',
    },
    {
      id: 'obliquus-capitis-inferior',
      label: 'Obliquus capitis inferior',
      group: 'Back',
    },
    {
      id: 'pectoralis-major',
      label: 'Pectoralis major',
      group: 'Chest',
    },
    {
      id: 'pectoralis-minor',
      label: 'Pectoralis minor',
      group: 'Chest',
    },
    {
      id: 'subclavius',
      label: 'Subclavius',
      group: 'Chest',
    },
    {
      id: 'serratus-anterior',
      label: 'Serratus anterior',
      group: 'Chest',
    },
    {
      id: 'external-intercostals',
      label: 'External intercostals',
      group: 'Chest',
    },
    {
      id: 'internal-intercostals',
      label: 'Internal intercostals',
      group: 'Chest',
    },
    {
      id: 'innermost-intercostals',
      label: 'Innermost intercostals',
      group: 'Chest',
    },
    {
      id: 'transversus-thoracis',
      label: 'Transversus thoracis',
      group: 'Chest',
    },
    {
      id: 'diaphragm',
      label: 'Diaphragm',
      group: 'Chest',
    },
    {
      id: 'rectus-abdominis',
      label: 'Rectus abdominis',
      group: 'Abdomen',
    },
    {
      id: 'pyramidalis',
      label: 'Pyramidalis',
      group: 'Abdomen',
    },
    {
      id: 'linea-alba',
      label: 'Linea alba',
      group: 'Abdomen',
    },
    {
      id: 'external-oblique',
      label: 'External oblique',
      group: 'Abdomen',
    },
    {
      id: 'internal-oblique',
      label: 'Internal oblique',
      group: 'Abdomen',
    },
    {
      id: 'transversus-abdominis',
      label: 'Transversus abdominis',
      group: 'Abdomen',
    },
    {
      id: 'quadratus-lumborum',
      label: 'Quadratus lumborum',
      group: 'Abdomen',
    },
    {
      id: 'pubococcygeus',
      label: 'Pubococcygeus',
      group: 'Pelvic floor',
    },
    {
      id: 'puborectalis',
      label: 'Puborectalis',
      group: 'Pelvic floor',
    },
    {
      id: 'iliococcygeus',
      label: 'Iliococcygeus',
      group: 'Pelvic floor',
    },
    {
      id: 'coccygeus',
      label: 'Coccygeus',
      group: 'Pelvic floor',
    },
    {
      id: 'external-anal-sphincter',
      label: 'External anal sphincter',
      group: 'Pelvic floor',
    },
    {
      id: 'deltoid',
      label: 'Deltoid',
      group: 'Shoulder',
    },
    {
      id: 'supraspinatus',
      label: 'Supraspinatus',
      group: 'Shoulder',
    },
    {
      id: 'infraspinatus',
      label: 'Infraspinatus',
      group: 'Shoulder',
    },
    {
      id: 'teres-minor',
      label: 'Teres minor',
      group: 'Shoulder',
    },
    {
      id: 'teres-major',
      label: 'Teres major',
      group: 'Shoulder',
    },
    {
      id: 'subscapularis',
      label: 'Subscapularis',
      group: 'Shoulder',
    },
    {
      id: 'biceps-brachii',
      label: 'Biceps brachii',
      group: 'Upper arm',
    },
    {
      id: 'brachialis',
      label: 'Brachialis',
      group: 'Upper arm',
    },
    {
      id: 'coracobrachialis',
      label: 'Coracobrachialis',
      group: 'Upper arm',
    },
    {
      id: 'triceps-brachii',
      label: 'Triceps brachii',
      group: 'Upper arm',
    },
    {
      id: 'anconeus',
      label: 'Anconeus',
      group: 'Upper arm',
    },
    {
      id: 'brachioradialis',
      label: 'Brachioradialis',
      group: 'Forearm',
    },
    {
      id: 'pronator-teres',
      label: 'Pronator teres',
      group: 'Forearm',
    },
    {
      id: 'flexor-carpi-radialis',
      label: 'Flexor carpi radialis',
      group: 'Forearm',
    },
    {
      id: 'palmaris-longus',
      label: 'Palmaris longus',
      group: 'Forearm',
    },
    {
      id: 'flexor-carpi-ulnaris',
      label: 'Flexor carpi ulnaris',
      group: 'Forearm',
    },
    {
      id: 'flexor-digitorum-superficialis',
      label: 'Flexor digitorum superficialis',
      group: 'Forearm',
    },
    {
      id: 'flexor-digitorum-profundus',
      label: 'Flexor digitorum profundus',
      group: 'Forearm',
    },
    {
      id: 'flexor-pollicis-longus',
      label: 'Flexor pollicis longus',
      group: 'Forearm',
    },
    {
      id: 'pronator-quadratus',
      label: 'Pronator quadratus',
      group: 'Forearm',
    },
    {
      id: 'supinator',
      label: 'Supinator',
      group: 'Forearm',
    },
    {
      id: 'extensor-carpi-radialis-longus',
      label: 'Extensor carpi radialis longus',
      group: 'Forearm',
    },
    {
      id: 'extensor-carpi-radialis-brevis',
      label: 'Extensor carpi radialis brevis',
      group: 'Forearm',
    },
    {
      id: 'extensor-digitorum',
      label: 'Extensor digitorum',
      group: 'Forearm',
    },
    {
      id: 'extensor-digiti-minimi',
      label: 'Extensor digiti minimi',
      group: 'Forearm',
    },
    {
      id: 'extensor-carpi-ulnaris',
      label: 'Extensor carpi ulnaris',
      group: 'Forearm',
    },
    {
      id: 'abductor-pollicis-longus',
      label: 'Abductor pollicis longus',
      group: 'Forearm',
    },
    {
      id: 'extensor-pollicis-brevis',
      label: 'Extensor pollicis brevis',
      group: 'Forearm',
    },
    {
      id: 'extensor-pollicis-longus',
      label: 'Extensor pollicis longus',
      group: 'Forearm',
    },
    {
      id: 'extensor-indicis',
      label: 'Extensor indicis',
      group: 'Forearm',
    },
    {
      id: 'abductor-pollicis-brevis',
      label: 'Abductor pollicis brevis',
      group: 'Hand',
    },
    {
      id: 'flexor-pollicis-brevis',
      label: 'Flexor pollicis brevis',
      group: 'Hand',
    },
    {
      id: 'opponens-pollicis',
      label: 'Opponens pollicis',
      group: 'Hand',
    },
    {
      id: 'adductor-pollicis',
      label: 'Adductor pollicis',
      group: 'Hand',
    },
    {
      id: 'abductor-digiti-minimi-hand',
      label: 'Abductor digiti minimi (hand)',
      group: 'Hand',
    },
    {
      id: 'flexor-digiti-minimi-brevis-hand',
      label: 'Flexor digiti minimi brevis (hand)',
      group: 'Hand',
    },
    {
      id: 'opponens-digiti-minimi-hand',
      label: 'Opponens digiti minimi (hand)',
      group: 'Hand',
    },
    {
      id: 'lumbricals-hand',
      label: 'Lumbricals (hand)',
      group: 'Hand',
    },
    {
      id: 'palmar-interossei',
      label: 'Palmar interossei',
      group: 'Hand',
    },
    {
      id: 'dorsal-interossei-hand',
      label: 'Dorsal interossei (hand)',
      group: 'Hand',
    },
    {
      id: 'iliacus',
      label: 'Iliacus',
      group: 'Hip',
    },
    {
      id: 'psoas-major',
      label: 'Psoas major',
      group: 'Hip',
    },
    {
      id: 'gluteus-maximus',
      label: 'Gluteus maximus',
      group: 'Hip',
    },
    {
      id: 'gluteus-medius',
      label: 'Gluteus medius',
      group: 'Hip',
    },
    {
      id: 'gluteus-minimus',
      label: 'Gluteus minimus',
      group: 'Hip',
    },
    {
      id: 'tensor-fasciae-latae',
      label: 'Tensor fasciae latae',
      group: 'Hip',
    },
    {
      id: 'piriformis',
      label: 'Piriformis',
      group: 'Hip',
    },
    {
      id: 'gemellus-superior',
      label: 'Gemellus superior',
      group: 'Hip',
    },
    {
      id: 'obturator-internus',
      label: 'Obturator internus',
      group: 'Hip',
    },
    {
      id: 'gemellus-inferior',
      label: 'Gemellus inferior',
      group: 'Hip',
    },
    {
      id: 'quadratus-femoris',
      label: 'Quadratus femoris',
      group: 'Hip',
    },
    {
      id: 'obturator-externus',
      label: 'Obturator externus',
      group: 'Hip',
    },
    {
      id: 'sartorius',
      label: 'Sartorius',
      group: 'Thigh',
    },
    {
      id: 'rectus-femoris',
      label: 'Rectus femoris',
      group: 'Thigh',
    },
    {
      id: 'vastus-lateralis',
      label: 'Vastus lateralis',
      group: 'Thigh',
    },
    {
      id: 'vastus-medialis',
      label: 'Vastus medialis',
      group: 'Thigh',
    },
    {
      id: 'vastus-intermedius',
      label: 'Vastus intermedius',
      group: 'Thigh',
    },
    {
      id: 'pectineus',
      label: 'Pectineus',
      group: 'Thigh',
    },
    {
      id: 'adductor-longus',
      label: 'Adductor longus',
      group: 'Thigh',
    },
    {
      id: 'adductor-brevis',
      label: 'Adductor brevis',
      group: 'Thigh',
    },
    {
      id: 'adductor-magnus',
      label: 'Adductor magnus',
      group: 'Thigh',
    },
    {
      id: 'adductor-minimus',
      label: 'Adductor minimus',
      group: 'Thigh',
    },
    {
      id: 'gracilis',
      label: 'Gracilis',
      group: 'Thigh',
    },
    {
      id: 'biceps-femoris',
      label: 'Biceps femoris',
      group: 'Thigh',
    },
    {
      id: 'semitendinosus',
      label: 'Semitendinosus',
      group: 'Thigh',
    },
    {
      id: 'semimembranosus',
      label: 'Semimembranosus',
      group: 'Thigh',
    },
    {
      id: 'tibialis-anterior',
      label: 'Tibialis anterior',
      group: 'Lower leg',
    },
    {
      id: 'extensor-hallucis-longus',
      label: 'Extensor hallucis longus',
      group: 'Lower leg',
    },
    {
      id: 'extensor-digitorum-longus',
      label: 'Extensor digitorum longus',
      group: 'Lower leg',
    },
    {
      id: 'fibularis-tertius',
      label: 'Fibularis tertius',
      group: 'Lower leg',
    },
    {
      id: 'fibularis-longus',
      label: 'Fibularis longus',
      group: 'Lower leg',
    },
    {
      id: 'fibularis-brevis',
      label: 'Fibularis brevis',
      group: 'Lower leg',
    },
    {
      id: 'gastrocnemius',
      label: 'Gastrocnemius',
      group: 'Lower leg',
    },
    {
      id: 'soleus',
      label: 'Soleus',
      group: 'Lower leg',
    },
    {
      id: 'plantaris',
      label: 'Plantaris',
      group: 'Lower leg',
    },
    {
      id: 'calcaneal-tendon',
      label: 'Calcaneal (Achilles) tendon',
      group: 'Lower leg',
    },
    {
      id: 'popliteus',
      label: 'Popliteus',
      group: 'Lower leg',
    },
    {
      id: 'flexor-digitorum-longus',
      label: 'Flexor digitorum longus',
      group: 'Lower leg',
    },
    {
      id: 'flexor-hallucis-longus',
      label: 'Flexor hallucis longus',
      group: 'Lower leg',
    },
    {
      id: 'tibialis-posterior',
      label: 'Tibialis posterior',
      group: 'Lower leg',
    },
    {
      id: 'extensor-digitorum-brevis',
      label: 'Extensor digitorum brevis',
      group: 'Foot',
    },
    {
      id: 'extensor-hallucis-brevis',
      label: 'Extensor hallucis brevis',
      group: 'Foot',
    },
    {
      id: 'abductor-hallucis',
      label: 'Abductor hallucis',
      group: 'Foot',
    },
    {
      id: 'flexor-digitorum-brevis',
      label: 'Flexor digitorum brevis',
      group: 'Foot',
    },
    {
      id: 'abductor-digiti-minimi-foot',
      label: 'Abductor digiti minimi (foot)',
      group: 'Foot',
    },
    {
      id: 'quadratus-plantae',
      label: 'Quadratus plantae',
      group: 'Foot',
    },
    {
      id: 'lumbricals-foot',
      label: 'Lumbricals (foot)',
      group: 'Foot',
    },
    {
      id: 'flexor-hallucis-brevis',
      label: 'Flexor hallucis brevis',
      group: 'Foot',
    },
    {
      id: 'adductor-hallucis',
      label: 'Adductor hallucis',
      group: 'Foot',
    },
    {
      id: 'flexor-digiti-minimi-brevis-foot',
      label: 'Flexor digiti minimi brevis (foot)',
      group: 'Foot',
    },
    {
      id: 'opponens-digiti-minimi-foot',
      label: 'Opponens digiti minimi (foot)',
      group: 'Foot',
    },
    {
      id: 'plantar-interossei',
      label: 'Plantar interossei',
      group: 'Foot',
    },
    {
      id: 'dorsal-interossei-foot',
      label: 'Dorsal interossei (foot)',
      group: 'Foot',
    },
  ],
  nails: [
    {
      id: 'nail-plate',
      label: 'Nail plate',
      group: 'Nail',
    },
    {
      id: 'lunula',
      label: 'Lunula',
      group: 'Nail',
    },
    {
      id: 'nail-matrix',
      label: 'Nail matrix',
      group: 'Nail',
    },
    {
      id: 'nail-bed',
      label: 'Nail bed',
      group: 'Nail',
    },
    {
      id: 'proximal-nail-fold',
      label: 'Proximal nail fold',
      group: 'Nail folds',
    },
    {
      id: 'eponychium',
      label: 'Eponychium (cuticle)',
      group: 'Nail folds',
    },
    {
      id: 'lateral-nail-fold',
      label: 'Lateral nail fold',
      group: 'Nail folds',
    },
    {
      id: 'hyponychium',
      label: 'Hyponychium',
      group: 'Nail folds',
    },
    {
      id: 'distal-phalanx',
      label: 'Distal phalanx',
      group: 'Fingertip',
    },
    {
      id: 'middle-phalanx',
      label: 'Middle phalanx',
      group: 'Fingertip',
    },
    {
      id: 'extensor-tendon',
      label: 'Extensor tendon',
      group: 'Fingertip',
    },
    {
      id: 'flexor-tendon',
      label: 'Flexor digitorum profundus tendon',
      group: 'Fingertip',
    },
    {
      id: 'fingertip-pulp',
      label: 'Fingertip pulp',
      group: 'Fingertip',
    },
    {
      id: 'skin',
      label: 'Skin',
      group: 'Fingertip',
    },
  ],
  nerves: [
    {
      id: 'olfactory-nerves',
      label: 'Olfactory nerves (I)',
      group: 'Cranial nerves',
    },
    {
      id: 'optic-nerves',
      label: 'Optic nerves (II)',
      group: 'Cranial nerves',
    },
    {
      id: 'oculomotor-nerves',
      label: 'Oculomotor nerves (III)',
      group: 'Cranial nerves',
    },
    {
      id: 'trochlear-nerves',
      label: 'Trochlear nerves (IV)',
      group: 'Cranial nerves',
    },
    {
      id: 'trigeminal-nerves',
      label: 'Trigeminal nerves (V)',
      group: 'Cranial nerves',
    },
    {
      id: 'abducens-nerves',
      label: 'Abducens nerves (VI)',
      group: 'Cranial nerves',
    },
    {
      id: 'facial-nerves',
      label: 'Facial nerves (VII)',
      group: 'Cranial nerves',
    },
    {
      id: 'vestibulocochlear-nerves',
      label: 'Vestibulocochlear nerves (VIII)',
      group: 'Cranial nerves',
    },
    {
      id: 'glossopharyngeal-nerves',
      label: 'Glossopharyngeal nerves (IX)',
      group: 'Cranial nerves',
    },
    {
      id: 'vagus-nerves',
      label: 'Vagus nerves (X)',
      group: 'Cranial nerves',
    },
    {
      id: 'accessory-nerves',
      label: 'Accessory nerves (XI)',
      group: 'Cranial nerves',
    },
    {
      id: 'hypoglossal-nerves',
      label: 'Hypoglossal nerves (XII)',
      group: 'Cranial nerves',
    },
    {
      id: 'spinal-nerve-roots',
      label: 'Spinal nerve roots and ganglia',
      group: 'Spinal roots',
    },
    {
      id: 'cauda-equina',
      label: 'Cauda equina',
      group: 'Spinal roots',
    },
    {
      id: 'intercostal-nerves',
      label: 'Intercostal nerves',
      group: 'Chest and abdomen',
    },
    {
      id: 'sympathetic-trunks',
      label: 'Sympathetic trunks',
      group: 'Chest and abdomen',
    },
    {
      id: 'iliohypogastric-ilio-inguinal-nerves',
      label: 'Iliohypogastric and ilio-inguinal nerves',
      group: 'Chest and abdomen',
    },
    {
      id: 'brachial-plexus',
      label: 'Brachial plexuses',
      group: 'Shoulder and arm',
    },
    {
      id: 'dorsal-scapular-nerves',
      label: 'Dorsal scapular nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'long-thoracic-nerves',
      label: 'Long thoracic nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'suprascapular-nerves',
      label: 'Suprascapular nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'pectoral-nerves',
      label: 'Pectoral nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'subscapular-nerves',
      label: 'Subscapular nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'thoracodorsal-nerves',
      label: 'Thoracodorsal nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'axillary-nerves',
      label: 'Axillary nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'musculocutaneous-nerves',
      label: 'Musculocutaneous nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'radial-nerves',
      label: 'Radial nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'median-nerves',
      label: 'Median nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'ulnar-nerves',
      label: 'Ulnar nerves',
      group: 'Shoulder and arm',
    },
    {
      id: 'medial-cutaneous-nerves',
      label: 'Medial cutaneous nerves of arm and forearm',
      group: 'Shoulder and arm',
    },
    {
      id: 'femoral-nerves',
      label: 'Femoral nerves',
      group: 'Hip and leg',
    },
    {
      id: 'lateral-femoral-cutaneous-nerves',
      label: 'Lateral femoral cutaneous nerves',
      group: 'Hip and leg',
    },
    {
      id: 'obturator-nerves',
      label: 'Obturator nerves',
      group: 'Hip and leg',
    },
    {
      id: 'genitofemoral-nerves',
      label: 'Genitofemoral nerves',
      group: 'Hip and leg',
    },
    {
      id: 'superior-gluteal-nerves',
      label: 'Superior gluteal nerves',
      group: 'Hip and leg',
    },
    {
      id: 'hip-rotator-nerves',
      label: 'Nerves to piriformis and quadratus femoris',
      group: 'Hip and leg',
    },
    {
      id: 'posterior-femoral-cutaneous-nerves',
      label: 'Posterior femoral cutaneous nerves',
      group: 'Hip and leg',
    },
    {
      id: 'pudendal-nerves',
      label: 'Pudendal nerves',
      group: 'Hip and leg',
    },
    {
      id: 'sciatic-nerves',
      label: 'Sciatic nerves',
      group: 'Hip and leg',
    },
    {
      id: 'tibial-nerves',
      label: 'Tibial nerves',
      group: 'Hip and leg',
    },
    {
      id: 'common-fibular-nerves',
      label: 'Common fibular nerves',
      group: 'Hip and leg',
    },
  ],
  nose: [
    {
      id: 'nasal-bones',
      label: 'Nasal bones',
      group: 'External nose',
    },
    {
      id: 'lateral-cartilages',
      label: 'Lateral nasal cartilages',
      group: 'External nose',
    },
    {
      id: 'alar-cartilages',
      label: 'Major alar cartilages',
      group: 'External nose',
    },
    {
      id: 'septal-cartilage',
      label: 'Septal cartilage',
      group: 'Nasal septum',
    },
    {
      id: 'vomer',
      label: 'Vomer',
      group: 'Nasal septum',
    },
    {
      id: 'nasal-cavity',
      label: 'Nasal cavity lining',
      group: 'Nasal cavity',
    },
    {
      id: 'inferior-conchae',
      label: 'Inferior nasal conchae',
      group: 'Nasal cavity',
    },
    {
      id: 'palatine-bones',
      label: 'Palatine bones',
      group: 'Nasal cavity',
    },
    {
      id: 'lacrimal-bones',
      label: 'Lacrimal bones',
      group: 'Nasal cavity',
    },
    {
      id: 'olfactory-nerves',
      label: 'Olfactory nerves',
      group: 'Nasal cavity',
    },
    {
      id: 'frontal-sinuses',
      label: 'Frontal sinuses',
      group: 'Paranasal sinuses',
    },
    {
      id: 'anterior-ethmoid-cells',
      label: 'Anterior ethmoid cells',
      group: 'Paranasal sinuses',
    },
    {
      id: 'middle-ethmoid-cells',
      label: 'Middle ethmoid cells',
      group: 'Paranasal sinuses',
    },
    {
      id: 'posterior-ethmoid-cells',
      label: 'Posterior ethmoid cells',
      group: 'Paranasal sinuses',
    },
    {
      id: 'maxillary-sinuses',
      label: 'Maxillary sinuses',
      group: 'Paranasal sinuses',
    },
    {
      id: 'sphenoid-sinus',
      label: 'Sphenoid sinus',
      group: 'Paranasal sinuses',
    },
    {
      id: 'frontal-bone',
      label: 'Frontal bone',
      group: 'Sinus bones',
    },
    {
      id: 'ethmoid',
      label: 'Ethmoid bone',
      group: 'Sinus bones',
    },
    {
      id: 'maxillae',
      label: 'Maxillae',
      group: 'Sinus bones',
    },
    {
      id: 'sphenoid-bone',
      label: 'Sphenoid bone',
      group: 'Sinus bones',
    },
    {
      id: 'pituitary',
      label: 'Pituitary gland',
      group: 'Neighbours',
    },
    {
      id: 'nasopharynx',
      label: 'Nasopharynx',
      group: 'Neighbours',
    },
  ],
  pancreas: [
    {
      id: 'pancreas',
      label: 'Pancreas',
      group: 'Pancreas',
    },
    {
      id: 'pancreatic-duct',
      label: 'Pancreatic duct',
      group: 'Pancreas',
    },
    {
      id: 'duodenum',
      label: 'Duodenum',
      group: 'Neighbouring organs',
    },
    {
      id: 'spleen',
      label: 'Spleen',
      group: 'Neighbouring organs',
    },
    {
      id: 'celiac-trunk',
      label: 'Celiac trunk',
      group: 'Arteries',
    },
    {
      id: 'common-hepatic-artery',
      label: 'Common hepatic artery',
      group: 'Arteries',
    },
    {
      id: 'gastroduodenal-artery',
      label: 'Gastroduodenal artery',
      group: 'Arteries',
    },
    {
      id: 'pancreaticoduodenal-arteries',
      label: 'Pancreaticoduodenal arteries',
      group: 'Arteries',
    },
    {
      id: 'splenic-artery',
      label: 'Splenic artery',
      group: 'Arteries',
    },
    {
      id: 'pancreatic-arteries',
      label: 'Pancreatic branches',
      group: 'Arteries',
    },
    {
      id: 'superior-mesenteric-artery',
      label: 'Superior mesenteric artery',
      group: 'Arteries',
    },
    {
      id: 'splenic-vein',
      label: 'Splenic vein',
      group: 'Veins',
    },
    {
      id: 'superior-mesenteric-vein',
      label: 'Superior mesenteric vein',
      group: 'Veins',
    },
    {
      id: 'portal-vein',
      label: 'Portal vein',
      group: 'Veins',
    },
    {
      id: 'pancreaticoduodenal-veins',
      label: 'Pancreaticoduodenal veins',
      group: 'Veins',
    },
  ],
  parathyroid: [
    {
      id: 'right-superior-parathyroid',
      label: 'Right superior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'right-inferior-parathyroid',
      label: 'Right inferior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'left-superior-parathyroid',
      label: 'Left superior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'left-inferior-parathyroid',
      label: 'Left inferior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'right-lobe',
      label: 'Right lobe',
      group: 'Thyroid gland',
    },
    {
      id: 'left-lobe',
      label: 'Left lobe',
      group: 'Thyroid gland',
    },
    {
      id: 'isthmus',
      label: 'Isthmus',
      group: 'Thyroid gland',
    },
    {
      id: 'thyroid-cartilage',
      label: 'Thyroid cartilage',
      group: 'Larynx',
    },
    {
      id: 'cricoid-cartilage',
      label: 'Cricoid cartilage',
      group: 'Larynx',
    },
  ],
  pharynx: [
    {
      id: 'superior-constrictor',
      label: 'Superior pharyngeal constrictor',
      group: 'Constrictors',
    },
    {
      id: 'middle-constrictor',
      label: 'Middle pharyngeal constrictor',
      group: 'Constrictors',
    },
    {
      id: 'inferior-constrictor',
      label: 'Inferior pharyngeal constrictor',
      group: 'Constrictors',
    },
    {
      id: 'pharyngeal-raphe',
      label: 'Pharyngeal raphe',
      group: 'Constrictors',
    },
    {
      id: 'stylopharyngeus',
      label: 'Stylopharyngeus',
      group: 'Longitudinal muscles',
    },
    {
      id: 'palatopharyngeus',
      label: 'Palatopharyngeus',
      group: 'Longitudinal muscles',
    },
    {
      id: 'salpingopharyngeus',
      label: 'Salpingopharyngeus',
      group: 'Longitudinal muscles',
    },
    {
      id: 'levator-veli-palatini',
      label: 'Levator veli palatini',
      group: 'Soft palate',
    },
    {
      id: 'tensor-veli-palatini',
      label: 'Tensor veli palatini',
      group: 'Soft palate',
    },
    {
      id: 'musculus-uvulae',
      label: 'Musculus uvulae',
      group: 'Soft palate',
    },
    {
      id: 'tongue',
      label: 'Tongue',
      group: 'Larynx and tongue',
    },
    {
      id: 'epiglottis',
      label: 'Epiglottis',
      group: 'Larynx and tongue',
    },
    {
      id: 'hyoid-bone',
      label: 'Hyoid bone',
      group: 'Larynx and tongue',
    },
    {
      id: 'thyroid-cartilage',
      label: 'Thyroid cartilage',
      group: 'Larynx and tongue',
    },
    {
      id: 'cricoid-cartilage',
      label: 'Cricoid cartilage',
      group: 'Larynx and tongue',
    },
    {
      id: 'arytenoid-cartilages',
      label: 'Arytenoid cartilages',
      group: 'Larynx and tongue',
    },
    {
      id: 'ascending-pharyngeal-artery',
      label: 'Ascending pharyngeal artery',
      group: 'Vessels and nerves',
    },
    {
      id: 'pharyngeal-venous-plexus',
      label: 'Pharyngeal venous plexus',
      group: 'Vessels and nerves',
    },
    {
      id: 'glossopharyngeal-nerves',
      label: 'Glossopharyngeal nerves',
      group: 'Vessels and nerves',
    },
    {
      id: 'pharyngeal-nerves',
      label: 'Pharyngeal nerves',
      group: 'Vessels and nerves',
    },
  ],
  pineal: [
    {
      id: 'pineal-gland',
      label: 'Pineal gland',
      group: 'Pineal gland',
    },
    {
      id: 'habenula',
      label: 'Habenula',
      group: 'Epithalamus',
    },
    {
      id: 'left-stria-medullaris',
      label: 'Left stria medullaris',
      group: 'Epithalamus',
    },
    {
      id: 'right-stria-medullaris',
      label: 'Right stria medullaris',
      group: 'Epithalamus',
    },
    {
      id: 'posterior-commissure',
      label: 'Posterior commissure',
      group: 'Epithalamus',
    },
    {
      id: 'left-thalamus',
      label: 'Left thalamus',
      group: 'Thalamus',
    },
    {
      id: 'right-thalamus',
      label: 'Right thalamus',
      group: 'Thalamus',
    },
    {
      id: 'superior-colliculi',
      label: 'Superior colliculi',
      group: 'Midbrain tectum',
    },
    {
      id: 'inferior-colliculi',
      label: 'Inferior colliculi',
      group: 'Midbrain tectum',
    },
    {
      id: 'third-ventricle',
      label: 'Third ventricle',
      group: 'Ventricles',
    },
    {
      id: 'cerebral-aqueduct',
      label: 'Cerebral aqueduct',
      group: 'Ventricles',
    },
    {
      id: 'right-internal-cerebral-vein',
      label: 'Right internal cerebral vein',
      group: 'Veins',
    },
    {
      id: 'great-cerebral-vein',
      label: 'Great cerebral vein',
      group: 'Veins',
    },
    {
      id: 'straight-sinus',
      label: 'Straight sinus',
      group: 'Veins',
    },
    {
      id: 'corpus-callosum',
      label: 'Corpus callosum',
      group: 'Cerebrum',
    },
  ],
  pituitary: [
    {
      id: 'pituitary-gland',
      label: 'Pituitary gland',
      group: 'Pituitary gland',
    },
    {
      id: 'hypothalamus',
      label: 'Hypothalamus',
      group: 'Hypothalamus',
    },
    {
      id: 'tuber-cinereum',
      label: 'Tuber cinereum',
      group: 'Hypothalamus',
    },
    {
      id: 'mammillary-bodies',
      label: 'Mammillary bodies',
      group: 'Hypothalamus',
    },
    {
      id: 'supraoptic-nuclei',
      label: 'Supraoptic nuclei',
      group: 'Hypothalamus',
    },
    {
      id: 'paraventricular-nuclei',
      label: 'Paraventricular nuclei',
      group: 'Hypothalamus',
    },
    {
      id: 'optic-chiasm',
      label: 'Optic chiasm',
      group: 'Visual pathway',
    },
    {
      id: 'right-optic-nerve',
      label: 'Right optic nerve',
      group: 'Visual pathway',
    },
    {
      id: 'left-optic-nerve',
      label: 'Left optic nerve',
      group: 'Visual pathway',
    },
    {
      id: 'right-optic-tract',
      label: 'Right optic tract',
      group: 'Visual pathway',
    },
    {
      id: 'left-optic-tract',
      label: 'Left optic tract',
      group: 'Visual pathway',
    },
    {
      id: 'hypophyseal-portal-veins',
      label: 'Hypophyseal portal veins',
      group: 'Blood supply',
    },
    {
      id: 'right-superior-hypophyseal-artery',
      label: 'Right superior hypophyseal artery',
      group: 'Blood supply',
    },
    {
      id: 'right-inferior-hypophyseal-artery',
      label: 'Right inferior hypophyseal artery',
      group: 'Blood supply',
    },
    {
      id: 'right-internal-carotid-artery',
      label: 'Right internal carotid artery',
      group: 'Blood supply',
    },
    {
      id: 'right-cavernous-sinus',
      label: 'Right cavernous sinus',
      group: 'Venous sinuses',
    },
    {
      id: 'anterior-intercavernous-sinus',
      label: 'Anterior intercavernous sinus',
      group: 'Venous sinuses',
    },
    {
      id: 'posterior-intercavernous-sinus',
      label: 'Posterior intercavernous sinus',
      group: 'Venous sinuses',
    },
    {
      id: 'sphenoid-bone',
      label: 'Sphenoid bone',
      group: 'Skull base',
    },
  ],
  prostate: [
    {
      id: 'prostate',
      label: 'Prostate',
      group: 'Glands',
    },
    {
      id: 'seminal-vesicles',
      label: 'Seminal vesicles',
      group: 'Glands',
    },
    {
      id: 'testes',
      label: 'Testes',
      group: 'Testes and ducts',
    },
    {
      id: 'epididymides',
      label: 'Epididymides',
      group: 'Testes and ducts',
    },
    {
      id: 'deferent-ducts',
      label: 'Deferent ducts',
      group: 'Testes and ducts',
    },
    {
      id: 'corpora-cavernosa',
      label: 'Corpora cavernosa',
      group: 'Penis and urethra',
    },
    {
      id: 'corpus-spongiosum',
      label: 'Corpus spongiosum',
      group: 'Penis and urethra',
    },
    {
      id: 'glans-penis',
      label: 'Glans penis',
      group: 'Penis and urethra',
    },
    {
      id: 'urethra',
      label: 'Urethra',
      group: 'Penis and urethra',
    },
    {
      id: 'dorsal-arteries',
      label: 'Dorsal arteries of penis',
      group: 'Vessels',
    },
    {
      id: 'dorsal-veins',
      label: 'Dorsal veins of penis',
      group: 'Vessels',
    },
    {
      id: 'urinary-bladder',
      label: 'Urinary bladder',
      group: 'Neighbouring organs',
    },
    {
      id: 'rectum',
      label: 'Rectum',
      group: 'Neighbouring organs',
    },
  ],
  'salivary-glands': [
    {
      id: 'right-parotid-gland',
      label: 'Right parotid gland',
      group: 'Parotid glands',
    },
    {
      id: 'left-parotid-gland',
      label: 'Left parotid gland',
      group: 'Parotid glands',
    },
    {
      id: 'right-accessory-parotid-gland',
      label: 'Right accessory parotid gland',
      group: 'Parotid glands',
    },
    {
      id: 'left-accessory-parotid-gland',
      label: 'Left accessory parotid gland',
      group: 'Parotid glands',
    },
    {
      id: 'right-parotid-duct',
      label: 'Right parotid duct',
      group: 'Parotid glands',
    },
    {
      id: 'left-parotid-duct',
      label: 'Left parotid duct',
      group: 'Parotid glands',
    },
    {
      id: 'right-submandibular-gland',
      label: 'Right submandibular gland',
      group: 'Submandibular glands',
    },
    {
      id: 'left-submandibular-gland',
      label: 'Left submandibular gland',
      group: 'Submandibular glands',
    },
    {
      id: 'right-submandibular-duct',
      label: 'Right submandibular duct',
      group: 'Submandibular glands',
    },
    {
      id: 'left-submandibular-duct',
      label: 'Left submandibular duct',
      group: 'Submandibular glands',
    },
    {
      id: 'right-sublingual-gland',
      label: 'Right sublingual gland',
      group: 'Sublingual glands',
    },
    {
      id: 'left-sublingual-gland',
      label: 'Left sublingual gland',
      group: 'Sublingual glands',
    },
    {
      id: 'mandible',
      label: 'Mandible',
      group: 'Neighbours',
    },
    {
      id: 'tongue',
      label: 'Tongue',
      group: 'Neighbours',
    },
    {
      id: 'hyoid-bone',
      label: 'Hyoid bone',
      group: 'Neighbours',
    },
  ],
  skeleton: [
    {
      id: 'frontal-bone',
      label: 'Frontal bone',
      group: 'Skull',
    },
    {
      id: 'right-parietal-bone',
      label: 'Right parietal bone',
      group: 'Skull',
    },
    {
      id: 'left-parietal-bone',
      label: 'Left parietal bone',
      group: 'Skull',
    },
    {
      id: 'occipital-bone',
      label: 'Occipital bone',
      group: 'Skull',
    },
    {
      id: 'right-temporal-bone',
      label: 'Right temporal bone',
      group: 'Skull',
    },
    {
      id: 'left-temporal-bone',
      label: 'Left temporal bone',
      group: 'Skull',
    },
    {
      id: 'sphenoid-bone',
      label: 'Sphenoid bone',
      group: 'Skull',
    },
    {
      id: 'ethmoid-bone',
      label: 'Ethmoid bone',
      group: 'Skull',
    },
    {
      id: 'right-nasal-bone',
      label: 'Right nasal bone',
      group: 'Skull',
    },
    {
      id: 'right-lacrimal-bone',
      label: 'Right lacrimal bone',
      group: 'Skull',
    },
    {
      id: 'right-zygomatic-bone',
      label: 'Right zygomatic bone',
      group: 'Skull',
    },
    {
      id: 'right-maxilla',
      label: 'Right maxilla',
      group: 'Skull',
    },
    {
      id: 'right-palatine-bone',
      label: 'Right palatine bone',
      group: 'Skull',
    },
    {
      id: 'right-inferior-nasal-concha',
      label: 'Right inferior nasal concha',
      group: 'Skull',
    },
    {
      id: 'left-nasal-bone',
      label: 'Left nasal bone',
      group: 'Skull',
    },
    {
      id: 'left-lacrimal-bone',
      label: 'Left lacrimal bone',
      group: 'Skull',
    },
    {
      id: 'left-zygomatic-bone',
      label: 'Left zygomatic bone',
      group: 'Skull',
    },
    {
      id: 'left-maxilla',
      label: 'Left maxilla',
      group: 'Skull',
    },
    {
      id: 'left-palatine-bone',
      label: 'Left palatine bone',
      group: 'Skull',
    },
    {
      id: 'left-inferior-nasal-concha',
      label: 'Left inferior nasal concha',
      group: 'Skull',
    },
    {
      id: 'vomer',
      label: 'Vomer',
      group: 'Skull',
    },
    {
      id: 'mandible',
      label: 'Mandible',
      group: 'Skull',
    },
    {
      id: 'hyoid-bone',
      label: 'Hyoid bone',
      group: 'Skull',
    },
    {
      id: 'atlas-c1',
      label: 'Atlas (C1)',
      group: 'Vertebral column',
    },
    {
      id: 'axis-c2',
      label: 'Axis (C2)',
      group: 'Vertebral column',
    },
    {
      id: 'third-cervical-vertebra-c3',
      label: 'Third cervical vertebra (C3)',
      group: 'Vertebral column',
    },
    {
      id: 'fourth-cervical-vertebra-c4',
      label: 'Fourth cervical vertebra (C4)',
      group: 'Vertebral column',
    },
    {
      id: 'fifth-cervical-vertebra-c5',
      label: 'Fifth cervical vertebra (C5)',
      group: 'Vertebral column',
    },
    {
      id: 'sixth-cervical-vertebra-c6',
      label: 'Sixth cervical vertebra (C6)',
      group: 'Vertebral column',
    },
    {
      id: 'seventh-cervical-vertebra-c7',
      label: 'Seventh cervical vertebra (C7)',
      group: 'Vertebral column',
    },
    {
      id: 'first-thoracic-vertebra-t1',
      label: 'First thoracic vertebra (T1)',
      group: 'Vertebral column',
    },
    {
      id: 'second-thoracic-vertebra-t2',
      label: 'Second thoracic vertebra (T2)',
      group: 'Vertebral column',
    },
    {
      id: 'third-thoracic-vertebra-t3',
      label: 'Third thoracic vertebra (T3)',
      group: 'Vertebral column',
    },
    {
      id: 'fourth-thoracic-vertebra-t4',
      label: 'Fourth thoracic vertebra (T4)',
      group: 'Vertebral column',
    },
    {
      id: 'fifth-thoracic-vertebra-t5',
      label: 'Fifth thoracic vertebra (T5)',
      group: 'Vertebral column',
    },
    {
      id: 'sixth-thoracic-vertebra-t6',
      label: 'Sixth thoracic vertebra (T6)',
      group: 'Vertebral column',
    },
    {
      id: 'seventh-thoracic-vertebra-t7',
      label: 'Seventh thoracic vertebra (T7)',
      group: 'Vertebral column',
    },
    {
      id: 'eighth-thoracic-vertebra-t8',
      label: 'Eighth thoracic vertebra (T8)',
      group: 'Vertebral column',
    },
    {
      id: 'ninth-thoracic-vertebra-t9',
      label: 'Ninth thoracic vertebra (T9)',
      group: 'Vertebral column',
    },
    {
      id: 'tenth-thoracic-vertebra-t10',
      label: 'Tenth thoracic vertebra (T10)',
      group: 'Vertebral column',
    },
    {
      id: 'eleventh-thoracic-vertebra-t11',
      label: 'Eleventh thoracic vertebra (T11)',
      group: 'Vertebral column',
    },
    {
      id: 'twelfth-thoracic-vertebra-t12',
      label: 'Twelfth thoracic vertebra (T12)',
      group: 'Vertebral column',
    },
    {
      id: 'first-lumbar-vertebra-l1',
      label: 'First lumbar vertebra (L1)',
      group: 'Vertebral column',
    },
    {
      id: 'second-lumbar-vertebra-l2',
      label: 'Second lumbar vertebra (L2)',
      group: 'Vertebral column',
    },
    {
      id: 'third-lumbar-vertebra-l3',
      label: 'Third lumbar vertebra (L3)',
      group: 'Vertebral column',
    },
    {
      id: 'fourth-lumbar-vertebra-l4',
      label: 'Fourth lumbar vertebra (L4)',
      group: 'Vertebral column',
    },
    {
      id: 'fifth-lumbar-vertebra-l5',
      label: 'Fifth lumbar vertebra (L5)',
      group: 'Vertebral column',
    },
    {
      id: 'sacrum',
      label: 'Sacrum',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-c2-c3',
      label: 'Intervertebral disc C2–C3',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-c3-c4',
      label: 'Intervertebral disc C3–C4',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-c4-c5',
      label: 'Intervertebral disc C4–C5',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-c5-c6',
      label: 'Intervertebral disc C5–C6',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-c6-c7',
      label: 'Intervertebral disc C6–C7',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-c7-t1',
      label: 'Intervertebral disc C7–T1',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t1-t2',
      label: 'Intervertebral disc T1–T2',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t2-t3',
      label: 'Intervertebral disc T2–T3',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t3-t4',
      label: 'Intervertebral disc T3–T4',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t4-t5',
      label: 'Intervertebral disc T4–T5',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t5-t6',
      label: 'Intervertebral disc T5–T6',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t6-t7',
      label: 'Intervertebral disc T6–T7',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t7-t8',
      label: 'Intervertebral disc T7–T8',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t8-t9',
      label: 'Intervertebral disc T8–T9',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t9-t10',
      label: 'Intervertebral disc T9–T10',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t10-t11',
      label: 'Intervertebral disc T10–T11',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t11-t12',
      label: 'Intervertebral disc T11–T12',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-t12-l1',
      label: 'Intervertebral disc T12–L1',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-l1-l2',
      label: 'Intervertebral disc L1–L2',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-l2-l3',
      label: 'Intervertebral disc L2–L3',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-l3-l4',
      label: 'Intervertebral disc L3–L4',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-l4-l5',
      label: 'Intervertebral disc L4–L5',
      group: 'Vertebral column',
    },
    {
      id: 'intervertebral-disc-l5-s1',
      label: 'Intervertebral disc L5–S1',
      group: 'Vertebral column',
    },
    {
      id: 'manubrium-of-sternum',
      label: 'Manubrium of sternum',
      group: 'Thorax',
    },
    {
      id: 'body-of-sternum',
      label: 'Body of sternum',
      group: 'Thorax',
    },
    {
      id: 'xiphoid-process',
      label: 'Xiphoid process',
      group: 'Thorax',
    },
    {
      id: 'right-first-rib',
      label: 'Right first rib',
      group: 'Thorax',
    },
    {
      id: 'right-second-rib',
      label: 'Right second rib',
      group: 'Thorax',
    },
    {
      id: 'right-third-rib',
      label: 'Right third rib',
      group: 'Thorax',
    },
    {
      id: 'right-fourth-rib',
      label: 'Right fourth rib',
      group: 'Thorax',
    },
    {
      id: 'right-fifth-rib',
      label: 'Right fifth rib',
      group: 'Thorax',
    },
    {
      id: 'right-sixth-rib',
      label: 'Right sixth rib',
      group: 'Thorax',
    },
    {
      id: 'right-seventh-rib',
      label: 'Right seventh rib',
      group: 'Thorax',
    },
    {
      id: 'right-eighth-rib',
      label: 'Right eighth rib',
      group: 'Thorax',
    },
    {
      id: 'right-ninth-rib',
      label: 'Right ninth rib',
      group: 'Thorax',
    },
    {
      id: 'right-tenth-rib',
      label: 'Right tenth rib',
      group: 'Thorax',
    },
    {
      id: 'right-eleventh-rib',
      label: 'Right eleventh rib',
      group: 'Thorax',
    },
    {
      id: 'right-twelfth-rib',
      label: 'Right twelfth rib',
      group: 'Thorax',
    },
    {
      id: 'left-first-rib',
      label: 'Left first rib',
      group: 'Thorax',
    },
    {
      id: 'left-second-rib',
      label: 'Left second rib',
      group: 'Thorax',
    },
    {
      id: 'left-third-rib',
      label: 'Left third rib',
      group: 'Thorax',
    },
    {
      id: 'left-fourth-rib',
      label: 'Left fourth rib',
      group: 'Thorax',
    },
    {
      id: 'left-fifth-rib',
      label: 'Left fifth rib',
      group: 'Thorax',
    },
    {
      id: 'left-sixth-rib',
      label: 'Left sixth rib',
      group: 'Thorax',
    },
    {
      id: 'left-seventh-rib',
      label: 'Left seventh rib',
      group: 'Thorax',
    },
    {
      id: 'left-eighth-rib',
      label: 'Left eighth rib',
      group: 'Thorax',
    },
    {
      id: 'left-ninth-rib',
      label: 'Left ninth rib',
      group: 'Thorax',
    },
    {
      id: 'left-tenth-rib',
      label: 'Left tenth rib',
      group: 'Thorax',
    },
    {
      id: 'left-eleventh-rib',
      label: 'Left eleventh rib',
      group: 'Thorax',
    },
    {
      id: 'left-twelfth-rib',
      label: 'Left twelfth rib',
      group: 'Thorax',
    },
    {
      id: 'right-first-costal-cartilage',
      label: 'Right first costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'right-second-costal-cartilage',
      label: 'Right second costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'right-third-costal-cartilage',
      label: 'Right third costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'right-fourth-costal-cartilage',
      label: 'Right fourth costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'right-fifth-costal-cartilage',
      label: 'Right fifth costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'right-sixth-costal-cartilage',
      label: 'Right sixth costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'right-seventh-costal-cartilage',
      label: 'Right seventh costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'right-lower-costal-cartilages',
      label: 'Right lower costal cartilages',
      group: 'Thorax',
    },
    {
      id: 'left-first-costal-cartilage',
      label: 'Left first costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'left-second-costal-cartilage',
      label: 'Left second costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'left-third-costal-cartilage',
      label: 'Left third costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'left-fourth-costal-cartilage',
      label: 'Left fourth costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'left-fifth-costal-cartilage',
      label: 'Left fifth costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'left-sixth-costal-cartilage',
      label: 'Left sixth costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'left-seventh-costal-cartilage',
      label: 'Left seventh costal cartilage',
      group: 'Thorax',
    },
    {
      id: 'left-lower-costal-cartilages',
      label: 'Left lower costal cartilages',
      group: 'Thorax',
    },
    {
      id: 'right-clavicle',
      label: 'Right clavicle',
      group: 'Right upper limb',
    },
    {
      id: 'right-scapula',
      label: 'Right scapula',
      group: 'Right upper limb',
    },
    {
      id: 'right-humerus',
      label: 'Right humerus',
      group: 'Right upper limb',
    },
    {
      id: 'right-radius',
      label: 'Right radius',
      group: 'Right upper limb',
    },
    {
      id: 'right-ulna',
      label: 'Right ulna',
      group: 'Right upper limb',
    },
    {
      id: 'right-scaphoid',
      label: 'Right scaphoid',
      group: 'Right upper limb',
    },
    {
      id: 'right-lunate',
      label: 'Right lunate',
      group: 'Right upper limb',
    },
    {
      id: 'right-triquetral',
      label: 'Right triquetral',
      group: 'Right upper limb',
    },
    {
      id: 'right-pisiform',
      label: 'Right pisiform',
      group: 'Right upper limb',
    },
    {
      id: 'right-trapezium',
      label: 'Right trapezium',
      group: 'Right upper limb',
    },
    {
      id: 'right-trapezoid',
      label: 'Right trapezoid',
      group: 'Right upper limb',
    },
    {
      id: 'right-capitate',
      label: 'Right capitate',
      group: 'Right upper limb',
    },
    {
      id: 'right-hamate',
      label: 'Right hamate',
      group: 'Right upper limb',
    },
    {
      id: 'right-first-metacarpal-bone',
      label: 'Right first metacarpal bone',
      group: 'Right upper limb',
    },
    {
      id: 'right-second-metacarpal-bone',
      label: 'Right second metacarpal bone',
      group: 'Right upper limb',
    },
    {
      id: 'right-third-metacarpal-bone',
      label: 'Right third metacarpal bone',
      group: 'Right upper limb',
    },
    {
      id: 'right-fourth-metacarpal-bone',
      label: 'Right fourth metacarpal bone',
      group: 'Right upper limb',
    },
    {
      id: 'right-fifth-metacarpal-bone',
      label: 'Right fifth metacarpal bone',
      group: 'Right upper limb',
    },
    {
      id: 'right-thumb-proximal-phalanx',
      label: 'Right thumb, proximal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-index-finger-proximal-phalanx',
      label: 'Right index finger, proximal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-middle-finger-proximal-phalanx',
      label: 'Right middle finger, proximal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-ring-finger-proximal-phalanx',
      label: 'Right ring finger, proximal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-little-finger-proximal-phalanx',
      label: 'Right little finger, proximal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-index-finger-middle-phalanx',
      label: 'Right index finger, middle phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-middle-finger-middle-phalanx',
      label: 'Right middle finger, middle phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-ring-finger-middle-phalanx',
      label: 'Right ring finger, middle phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-little-finger-middle-phalanx',
      label: 'Right little finger, middle phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-thumb-distal-phalanx',
      label: 'Right thumb, distal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-index-finger-distal-phalanx',
      label: 'Right index finger, distal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-middle-finger-distal-phalanx',
      label: 'Right middle finger, distal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-ring-finger-distal-phalanx',
      label: 'Right ring finger, distal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'right-little-finger-distal-phalanx',
      label: 'Right little finger, distal phalanx',
      group: 'Right upper limb',
    },
    {
      id: 'left-clavicle',
      label: 'Left clavicle',
      group: 'Left upper limb',
    },
    {
      id: 'left-scapula',
      label: 'Left scapula',
      group: 'Left upper limb',
    },
    {
      id: 'left-humerus',
      label: 'Left humerus',
      group: 'Left upper limb',
    },
    {
      id: 'left-radius',
      label: 'Left radius',
      group: 'Left upper limb',
    },
    {
      id: 'left-ulna',
      label: 'Left ulna',
      group: 'Left upper limb',
    },
    {
      id: 'left-scaphoid',
      label: 'Left scaphoid',
      group: 'Left upper limb',
    },
    {
      id: 'left-lunate',
      label: 'Left lunate',
      group: 'Left upper limb',
    },
    {
      id: 'left-triquetral',
      label: 'Left triquetral',
      group: 'Left upper limb',
    },
    {
      id: 'left-pisiform',
      label: 'Left pisiform',
      group: 'Left upper limb',
    },
    {
      id: 'left-trapezium',
      label: 'Left trapezium',
      group: 'Left upper limb',
    },
    {
      id: 'left-trapezoid',
      label: 'Left trapezoid',
      group: 'Left upper limb',
    },
    {
      id: 'left-capitate',
      label: 'Left capitate',
      group: 'Left upper limb',
    },
    {
      id: 'left-hamate',
      label: 'Left hamate',
      group: 'Left upper limb',
    },
    {
      id: 'left-first-metacarpal-bone',
      label: 'Left first metacarpal bone',
      group: 'Left upper limb',
    },
    {
      id: 'left-second-metacarpal-bone',
      label: 'Left second metacarpal bone',
      group: 'Left upper limb',
    },
    {
      id: 'left-third-metacarpal-bone',
      label: 'Left third metacarpal bone',
      group: 'Left upper limb',
    },
    {
      id: 'left-fourth-metacarpal-bone',
      label: 'Left fourth metacarpal bone',
      group: 'Left upper limb',
    },
    {
      id: 'left-fifth-metacarpal-bone',
      label: 'Left fifth metacarpal bone',
      group: 'Left upper limb',
    },
    {
      id: 'left-thumb-proximal-phalanx',
      label: 'Left thumb, proximal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-index-finger-proximal-phalanx',
      label: 'Left index finger, proximal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-middle-finger-proximal-phalanx',
      label: 'Left middle finger, proximal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-ring-finger-proximal-phalanx',
      label: 'Left ring finger, proximal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-little-finger-proximal-phalanx',
      label: 'Left little finger, proximal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-index-finger-middle-phalanx',
      label: 'Left index finger, middle phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-middle-finger-middle-phalanx',
      label: 'Left middle finger, middle phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-ring-finger-middle-phalanx',
      label: 'Left ring finger, middle phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-little-finger-middle-phalanx',
      label: 'Left little finger, middle phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-thumb-distal-phalanx',
      label: 'Left thumb, distal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-index-finger-distal-phalanx',
      label: 'Left index finger, distal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-middle-finger-distal-phalanx',
      label: 'Left middle finger, distal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-ring-finger-distal-phalanx',
      label: 'Left ring finger, distal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'left-little-finger-distal-phalanx',
      label: 'Left little finger, distal phalanx',
      group: 'Left upper limb',
    },
    {
      id: 'right-hip-bone',
      label: 'Right hip bone',
      group: 'Pelvis',
    },
    {
      id: 'left-hip-bone',
      label: 'Left hip bone',
      group: 'Pelvis',
    },
    {
      id: 'right-femur',
      label: 'Right femur',
      group: 'Right lower limb',
    },
    {
      id: 'right-patella',
      label: 'Right patella',
      group: 'Right lower limb',
    },
    {
      id: 'right-tibia',
      label: 'Right tibia',
      group: 'Right lower limb',
    },
    {
      id: 'right-fibula',
      label: 'Right fibula',
      group: 'Right lower limb',
    },
    {
      id: 'right-talus',
      label: 'Right talus',
      group: 'Right lower limb',
    },
    {
      id: 'right-calcaneus',
      label: 'Right calcaneus',
      group: 'Right lower limb',
    },
    {
      id: 'right-navicular',
      label: 'Right navicular',
      group: 'Right lower limb',
    },
    {
      id: 'right-cuboid',
      label: 'Right cuboid',
      group: 'Right lower limb',
    },
    {
      id: 'right-medial-cuneiform',
      label: 'Right medial cuneiform',
      group: 'Right lower limb',
    },
    {
      id: 'right-intermediate-cuneiform',
      label: 'Right intermediate cuneiform',
      group: 'Right lower limb',
    },
    {
      id: 'right-lateral-cuneiform',
      label: 'Right lateral cuneiform',
      group: 'Right lower limb',
    },
    {
      id: 'right-first-metatarsal-bone',
      label: 'Right first metatarsal bone',
      group: 'Right lower limb',
    },
    {
      id: 'right-second-metatarsal-bone',
      label: 'Right second metatarsal bone',
      group: 'Right lower limb',
    },
    {
      id: 'right-third-metatarsal-bone',
      label: 'Right third metatarsal bone',
      group: 'Right lower limb',
    },
    {
      id: 'right-fourth-metatarsal-bone',
      label: 'Right fourth metatarsal bone',
      group: 'Right lower limb',
    },
    {
      id: 'right-fifth-metatarsal-bone',
      label: 'Right fifth metatarsal bone',
      group: 'Right lower limb',
    },
    {
      id: 'right-big-toe-proximal-phalanx',
      label: 'Right big toe, proximal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-second-toe-proximal-phalanx',
      label: 'Right second toe, proximal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-third-toe-proximal-phalanx',
      label: 'Right third toe, proximal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-fourth-toe-proximal-phalanx',
      label: 'Right fourth toe, proximal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-little-toe-proximal-phalanx',
      label: 'Right little toe, proximal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-second-toe-middle-phalanx',
      label: 'Right second toe, middle phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-third-toe-middle-phalanx',
      label: 'Right third toe, middle phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-fourth-toe-middle-phalanx',
      label: 'Right fourth toe, middle phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-little-toe-middle-phalanx',
      label: 'Right little toe, middle phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-big-toe-distal-phalanx',
      label: 'Right big toe, distal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-second-toe-distal-phalanx',
      label: 'Right second toe, distal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-third-toe-distal-phalanx',
      label: 'Right third toe, distal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-fourth-toe-distal-phalanx',
      label: 'Right fourth toe, distal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-little-toe-distal-phalanx',
      label: 'Right little toe, distal phalanx',
      group: 'Right lower limb',
    },
    {
      id: 'right-sesamoid-bones-of-the-foot',
      label: 'Right sesamoid bones of the foot',
      group: 'Right lower limb',
    },
    {
      id: 'left-femur',
      label: 'Left femur',
      group: 'Left lower limb',
    },
    {
      id: 'left-patella',
      label: 'Left patella',
      group: 'Left lower limb',
    },
    {
      id: 'left-tibia',
      label: 'Left tibia',
      group: 'Left lower limb',
    },
    {
      id: 'left-fibula',
      label: 'Left fibula',
      group: 'Left lower limb',
    },
    {
      id: 'left-talus',
      label: 'Left talus',
      group: 'Left lower limb',
    },
    {
      id: 'left-calcaneus',
      label: 'Left calcaneus',
      group: 'Left lower limb',
    },
    {
      id: 'left-navicular',
      label: 'Left navicular',
      group: 'Left lower limb',
    },
    {
      id: 'left-cuboid',
      label: 'Left cuboid',
      group: 'Left lower limb',
    },
    {
      id: 'left-medial-cuneiform',
      label: 'Left medial cuneiform',
      group: 'Left lower limb',
    },
    {
      id: 'left-intermediate-cuneiform',
      label: 'Left intermediate cuneiform',
      group: 'Left lower limb',
    },
    {
      id: 'left-lateral-cuneiform',
      label: 'Left lateral cuneiform',
      group: 'Left lower limb',
    },
    {
      id: 'left-first-metatarsal-bone',
      label: 'Left first metatarsal bone',
      group: 'Left lower limb',
    },
    {
      id: 'left-second-metatarsal-bone',
      label: 'Left second metatarsal bone',
      group: 'Left lower limb',
    },
    {
      id: 'left-third-metatarsal-bone',
      label: 'Left third metatarsal bone',
      group: 'Left lower limb',
    },
    {
      id: 'left-fourth-metatarsal-bone',
      label: 'Left fourth metatarsal bone',
      group: 'Left lower limb',
    },
    {
      id: 'left-fifth-metatarsal-bone',
      label: 'Left fifth metatarsal bone',
      group: 'Left lower limb',
    },
    {
      id: 'left-big-toe-proximal-phalanx',
      label: 'Left big toe, proximal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-second-toe-proximal-phalanx',
      label: 'Left second toe, proximal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-third-toe-proximal-phalanx',
      label: 'Left third toe, proximal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-fourth-toe-proximal-phalanx',
      label: 'Left fourth toe, proximal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-little-toe-proximal-phalanx',
      label: 'Left little toe, proximal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-second-toe-middle-phalanx',
      label: 'Left second toe, middle phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-third-toe-middle-phalanx',
      label: 'Left third toe, middle phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-fourth-toe-middle-phalanx',
      label: 'Left fourth toe, middle phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-little-toe-middle-phalanx',
      label: 'Left little toe, middle phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-big-toe-distal-phalanx',
      label: 'Left big toe, distal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-second-toe-distal-phalanx',
      label: 'Left second toe, distal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-third-toe-distal-phalanx',
      label: 'Left third toe, distal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-fourth-toe-distal-phalanx',
      label: 'Left fourth toe, distal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-little-toe-distal-phalanx',
      label: 'Left little toe, distal phalanx',
      group: 'Left lower limb',
    },
    {
      id: 'left-sesamoid-bones-of-the-foot',
      label: 'Left sesamoid bones of the foot',
      group: 'Left lower limb',
    },
  ],
  skin: [
    {
      id: 'epidermis',
      label: 'Epidermis',
      group: 'Skin layers',
    },
    {
      id: 'papillary-dermis',
      label: 'Papillary dermis',
      group: 'Skin layers',
    },
    {
      id: 'reticular-dermis',
      label: 'Reticular dermis',
      group: 'Skin layers',
    },
    {
      id: 'hypodermis',
      label: 'Hypodermis',
      group: 'Skin layers',
    },
    {
      id: 'hair-shaft',
      label: 'Hair shaft',
      group: 'Hair and glands',
    },
    {
      id: 'hair-follicle',
      label: 'Hair follicle',
      group: 'Hair and glands',
    },
    {
      id: 'sebaceous-gland',
      label: 'Sebaceous gland',
      group: 'Hair and glands',
    },
    {
      id: 'arrector-pili',
      label: 'Arrector pili muscle',
      group: 'Hair and glands',
    },
    {
      id: 'sweat-gland',
      label: 'Eccrine sweat gland',
      group: 'Hair and glands',
    },
    {
      id: 'arteries',
      label: 'Cutaneous arteries',
      group: 'Vessels and nerves',
    },
    {
      id: 'veins',
      label: 'Cutaneous veins',
      group: 'Vessels and nerves',
    },
    {
      id: 'nerve',
      label: 'Cutaneous nerve',
      group: 'Vessels and nerves',
    },
    {
      id: 'lamellar-corpuscle',
      label: 'Lamellar corpuscle',
      group: 'Vessels and nerves',
    },
  ],
  'spinal-cord': [
    {
      id: 'spinal-cord',
      label: 'Spinal cord',
      group: 'Cord and brainstem',
    },
    {
      id: 'medulla-oblongata',
      label: 'Medulla oblongata',
      group: 'Cord and brainstem',
    },
    {
      id: 'nerve-c1',
      label: 'C1 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-c2',
      label: 'C2 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-c3',
      label: 'C3 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-c4',
      label: 'C4 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-c5',
      label: 'C5 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-c6',
      label: 'C6 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-c7',
      label: 'C7 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-c8',
      label: 'C8 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-t1',
      label: 'T1 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'nerve-t2',
      label: 'T2 spinal nerve (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'brachial-plexus',
      label: 'Brachial plexus (left)',
      group: 'Spinal nerves',
    },
    {
      id: 'cauda-equina',
      label: 'Cauda equina',
      group: 'Spinal nerves',
    },
    {
      id: 'vertebra-c1',
      label: 'Atlas (C1)',
      group: 'Cervical vertebrae',
    },
    {
      id: 'vertebra-c2',
      label: 'Axis (C2)',
      group: 'Cervical vertebrae',
    },
    {
      id: 'vertebra-c3',
      label: 'C3 vertebra',
      group: 'Cervical vertebrae',
    },
    {
      id: 'vertebra-c4',
      label: 'C4 vertebra',
      group: 'Cervical vertebrae',
    },
    {
      id: 'vertebra-c5',
      label: 'C5 vertebra',
      group: 'Cervical vertebrae',
    },
    {
      id: 'vertebra-c6',
      label: 'C6 vertebra',
      group: 'Cervical vertebrae',
    },
    {
      id: 'vertebra-c7',
      label: 'C7 vertebra',
      group: 'Cervical vertebrae',
    },
    {
      id: 'vertebra-t1',
      label: 'T1 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t2',
      label: 'T2 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t3',
      label: 'T3 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t4',
      label: 'T4 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t5',
      label: 'T5 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t6',
      label: 'T6 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t7',
      label: 'T7 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t8',
      label: 'T8 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t9',
      label: 'T9 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t10',
      label: 'T10 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t11',
      label: 'T11 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-t12',
      label: 'T12 vertebra',
      group: 'Thoracic vertebrae',
    },
    {
      id: 'vertebra-l1',
      label: 'L1 vertebra',
      group: 'Lumbar vertebrae and sacrum',
    },
    {
      id: 'vertebra-l2',
      label: 'L2 vertebra',
      group: 'Lumbar vertebrae and sacrum',
    },
    {
      id: 'vertebra-l3',
      label: 'L3 vertebra',
      group: 'Lumbar vertebrae and sacrum',
    },
    {
      id: 'vertebra-l4',
      label: 'L4 vertebra',
      group: 'Lumbar vertebrae and sacrum',
    },
    {
      id: 'vertebra-l5',
      label: 'L5 vertebra',
      group: 'Lumbar vertebrae and sacrum',
    },
    {
      id: 'sacrum',
      label: 'Sacrum',
      group: 'Lumbar vertebrae and sacrum',
    },
    {
      id: 'disc-c2-c3',
      label: 'C2–C3 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-c3-c4',
      label: 'C3–C4 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-c4-c5',
      label: 'C4–C5 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-c5-c6',
      label: 'C5–C6 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-c6-c7',
      label: 'C6–C7 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-c7-t1',
      label: 'C7–T1 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t1-t2',
      label: 'T1–T2 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t2-t3',
      label: 'T2–T3 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t3-t4',
      label: 'T3–T4 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t4-t5',
      label: 'T4–T5 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t5-t6',
      label: 'T5–T6 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t6-t7',
      label: 'T6–T7 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t7-t8',
      label: 'T7–T8 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t8-t9',
      label: 'T8–T9 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t9-t10',
      label: 'T9–T10 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t10-t11',
      label: 'T10–T11 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t11-t12',
      label: 'T11–T12 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-t12-l1',
      label: 'T12–L1 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-l1-l2',
      label: 'L1–L2 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-l2-l3',
      label: 'L2–L3 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-l3-l4',
      label: 'L3–L4 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-l4-l5',
      label: 'L4–L5 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'disc-l5-s1',
      label: 'L5–S1 disc',
      group: 'Intervertebral discs',
    },
    {
      id: 'vertebral-arteries',
      label: 'Vertebral arteries',
      group: 'Vessels',
    },
  ],
  spleen: [
    {
      id: 'spleen',
      label: 'Spleen',
      group: 'Spleen',
    },
    {
      id: 'splenic-artery',
      label: 'Splenic artery',
      group: 'Splenic vessels',
    },
    {
      id: 'splenic-vein',
      label: 'Splenic vein',
      group: 'Splenic vessels',
    },
    {
      id: 'celiac-trunk',
      label: 'Celiac trunk',
      group: 'Splenic vessels',
    },
    {
      id: 'superior-mesenteric-vein',
      label: 'Superior mesenteric vein',
      group: 'Splenic vessels',
    },
    {
      id: 'stomach',
      label: 'Stomach',
      group: 'Neighbouring organs',
    },
    {
      id: 'pancreas',
      label: 'Pancreas',
      group: 'Neighbouring organs',
    },
    {
      id: 'left-kidney',
      label: 'Left kidney',
      group: 'Neighbouring organs',
    },
    {
      id: 'left-adrenal',
      label: 'Left adrenal gland',
      group: 'Neighbouring organs',
    },
  ],
  stomach: [
    {
      id: 'stomach',
      label: 'Stomach',
      group: 'Digestive tract',
    },
    {
      id: 'esophagus',
      label: 'Esophagus (lower part)',
      group: 'Digestive tract',
    },
    {
      id: 'duodenum',
      label: 'Duodenum',
      group: 'Digestive tract',
    },
    {
      id: 'celiac-trunk',
      label: 'Celiac trunk',
      group: 'Arteries',
    },
    {
      id: 'left-gastric-artery',
      label: 'Left gastric artery',
      group: 'Arteries',
    },
    {
      id: 'splenic-artery',
      label: 'Splenic artery',
      group: 'Arteries',
    },
    {
      id: 'common-hepatic-artery',
      label: 'Common hepatic artery',
      group: 'Arteries',
    },
    {
      id: 'spleen',
      label: 'Spleen',
      group: 'Neighbouring organs',
    },
    {
      id: 'pancreas',
      label: 'Pancreas',
      group: 'Neighbouring organs',
    },
  ],
  teeth: [
    {
      id: 'upper-right-central-incisor',
      label: 'Upper right central incisor',
      group: 'Upper right teeth',
    },
    {
      id: 'upper-right-lateral-incisor',
      label: 'Upper right lateral incisor',
      group: 'Upper right teeth',
    },
    {
      id: 'upper-right-canine',
      label: 'Upper right canine',
      group: 'Upper right teeth',
    },
    {
      id: 'upper-right-first-premolar',
      label: 'Upper right first premolar',
      group: 'Upper right teeth',
    },
    {
      id: 'upper-right-second-premolar',
      label: 'Upper right second premolar',
      group: 'Upper right teeth',
    },
    {
      id: 'upper-right-first-molar',
      label: 'Upper right first molar',
      group: 'Upper right teeth',
    },
    {
      id: 'upper-right-second-molar',
      label: 'Upper right second molar',
      group: 'Upper right teeth',
    },
    {
      id: 'upper-left-central-incisor',
      label: 'Upper left central incisor',
      group: 'Upper left teeth',
    },
    {
      id: 'upper-left-lateral-incisor',
      label: 'Upper left lateral incisor',
      group: 'Upper left teeth',
    },
    {
      id: 'upper-left-canine',
      label: 'Upper left canine',
      group: 'Upper left teeth',
    },
    {
      id: 'upper-left-first-premolar',
      label: 'Upper left first premolar',
      group: 'Upper left teeth',
    },
    {
      id: 'upper-left-second-premolar',
      label: 'Upper left second premolar',
      group: 'Upper left teeth',
    },
    {
      id: 'upper-left-first-molar',
      label: 'Upper left first molar',
      group: 'Upper left teeth',
    },
    {
      id: 'upper-left-second-molar',
      label: 'Upper left second molar',
      group: 'Upper left teeth',
    },
    {
      id: 'lower-left-central-incisor',
      label: 'Lower left central incisor',
      group: 'Lower left teeth',
    },
    {
      id: 'lower-left-lateral-incisor',
      label: 'Lower left lateral incisor',
      group: 'Lower left teeth',
    },
    {
      id: 'lower-left-canine',
      label: 'Lower left canine',
      group: 'Lower left teeth',
    },
    {
      id: 'lower-left-first-premolar',
      label: 'Lower left first premolar',
      group: 'Lower left teeth',
    },
    {
      id: 'lower-left-second-premolar',
      label: 'Lower left second premolar',
      group: 'Lower left teeth',
    },
    {
      id: 'lower-left-first-molar',
      label: 'Lower left first molar',
      group: 'Lower left teeth',
    },
    {
      id: 'lower-left-second-molar',
      label: 'Lower left second molar',
      group: 'Lower left teeth',
    },
    {
      id: 'lower-right-central-incisor',
      label: 'Lower right central incisor',
      group: 'Lower right teeth',
    },
    {
      id: 'lower-right-lateral-incisor',
      label: 'Lower right lateral incisor',
      group: 'Lower right teeth',
    },
    {
      id: 'lower-right-canine',
      label: 'Lower right canine',
      group: 'Lower right teeth',
    },
    {
      id: 'lower-right-first-premolar',
      label: 'Lower right first premolar',
      group: 'Lower right teeth',
    },
    {
      id: 'lower-right-second-premolar',
      label: 'Lower right second premolar',
      group: 'Lower right teeth',
    },
    {
      id: 'lower-right-first-molar',
      label: 'Lower right first molar',
      group: 'Lower right teeth',
    },
    {
      id: 'lower-right-second-molar',
      label: 'Lower right second molar',
      group: 'Lower right teeth',
    },
    {
      id: 'upper-gum',
      label: 'Upper gum',
      group: 'Gums',
    },
    {
      id: 'lower-gum',
      label: 'Lower gum',
      group: 'Gums',
    },
    {
      id: 'right-maxilla',
      label: 'Right maxilla',
      group: 'Jaw bones',
    },
    {
      id: 'left-maxilla',
      label: 'Left maxilla',
      group: 'Jaw bones',
    },
    {
      id: 'mandible',
      label: 'Mandible',
      group: 'Jaw bones',
    },
  ],
  thymus: [
    {
      id: 'right-lobe',
      label: 'Right lobe',
      group: 'Thymus',
    },
    {
      id: 'left-lobe',
      label: 'Left lobe',
      group: 'Thymus',
    },
    {
      id: 'ascending-aorta',
      label: 'Ascending aorta',
      group: 'Arteries',
    },
    {
      id: 'aortic-arch',
      label: 'Aortic arch',
      group: 'Arteries',
    },
    {
      id: 'brachiocephalic-trunk',
      label: 'Brachiocephalic trunk',
      group: 'Arteries',
    },
    {
      id: 'left-common-carotid',
      label: 'Left common carotid artery',
      group: 'Arteries',
    },
    {
      id: 'left-subclavian',
      label: 'Left subclavian artery',
      group: 'Arteries',
    },
    {
      id: 'pulmonary-trunk',
      label: 'Pulmonary trunk',
      group: 'Arteries',
    },
    {
      id: 'superior-vena-cava',
      label: 'Superior vena cava',
      group: 'Veins',
    },
    {
      id: 'right-brachiocephalic-vein',
      label: 'Right brachiocephalic vein',
      group: 'Veins',
    },
    {
      id: 'left-brachiocephalic-vein',
      label: 'Left brachiocephalic vein',
      group: 'Veins',
    },
    {
      id: 'heart',
      label: 'Heart',
      group: 'Neighbouring organs',
    },
    {
      id: 'trachea',
      label: 'Trachea',
      group: 'Neighbouring organs',
    },
  ],
  thyroid: [
    {
      id: 'right-lobe',
      label: 'Right lobe',
      group: 'Thyroid gland',
    },
    {
      id: 'left-lobe',
      label: 'Left lobe',
      group: 'Thyroid gland',
    },
    {
      id: 'isthmus',
      label: 'Isthmus',
      group: 'Thyroid gland',
    },
    {
      id: 'right-superior-parathyroid',
      label: 'Right superior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'right-inferior-parathyroid',
      label: 'Right inferior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'left-superior-parathyroid',
      label: 'Left superior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'left-inferior-parathyroid',
      label: 'Left inferior parathyroid',
      group: 'Parathyroid glands',
    },
    {
      id: 'hyoid-bone',
      label: 'Hyoid bone',
      group: 'Larynx and trachea',
    },
    {
      id: 'thyroid-cartilage',
      label: 'Thyroid cartilage',
      group: 'Larynx and trachea',
    },
    {
      id: 'cricoid-cartilage',
      label: 'Cricoid cartilage',
      group: 'Larynx and trachea',
    },
    {
      id: 'trachea',
      label: 'Trachea',
      group: 'Larynx and trachea',
    },
    {
      id: 'common-carotid-artery',
      label: 'Right common carotid artery',
      group: 'Arteries',
    },
    {
      id: 'superior-thyroid-artery',
      label: 'Superior thyroid artery',
      group: 'Arteries',
    },
    {
      id: 'superior-thyroid-vein',
      label: 'Superior thyroid vein',
      group: 'Veins',
    },
    {
      id: 'middle-thyroid-vein',
      label: 'Middle thyroid vein',
      group: 'Veins',
    },
    {
      id: 'inferior-thyroid-veins',
      label: 'Inferior thyroid veins',
      group: 'Veins',
    },
    {
      id: 'right-recurrent-laryngeal-nerve',
      label: 'Right recurrent laryngeal nerve',
      group: 'Nerves',
    },
    {
      id: 'left-recurrent-laryngeal-nerve',
      label: 'Left recurrent laryngeal nerve',
      group: 'Nerves',
    },
  ],
  tongue: [
    {
      id: 'tongue',
      label: 'Tongue',
      group: 'Tongue',
    },
    {
      id: 'genioglossus',
      label: 'Genioglossus',
      group: 'Extrinsic muscles',
    },
    {
      id: 'hyoglossus',
      label: 'Hyoglossus',
      group: 'Extrinsic muscles',
    },
    {
      id: 'geniohyoid',
      label: 'Geniohyoid',
      group: 'Floor of mouth',
    },
    {
      id: 'mylohyoid',
      label: 'Mylohyoid',
      group: 'Floor of mouth',
    },
    {
      id: 'hyoid-bone',
      label: 'Hyoid bone',
      group: 'Nearby structures',
    },
    {
      id: 'epiglottis',
      label: 'Epiglottis',
      group: 'Nearby structures',
    },
    {
      id: 'submandibular-glands',
      label: 'Submandibular glands',
      group: 'Nearby structures',
    },
    {
      id: 'sublingual-glands',
      label: 'Sublingual glands',
      group: 'Nearby structures',
    },
    {
      id: 'hypoglossal-nerves',
      label: 'Hypoglossal nerves',
      group: 'Nerves',
    },
    {
      id: 'lingual-nerves',
      label: 'Lingual nerves',
      group: 'Nerves',
    },
    {
      id: 'lingual-artery',
      label: 'Lingual artery',
      group: 'Vessels',
    },
    {
      id: 'lingual-veins',
      label: 'Lingual veins',
      group: 'Vessels',
    },
  ],
  uterus: [
    {
      id: 'fundus',
      label: 'Fundus',
      group: 'Uterus and vagina',
    },
    {
      id: 'body',
      label: 'Body',
      group: 'Uterus and vagina',
    },
    {
      id: 'cornua',
      label: 'Cornua',
      group: 'Uterus and vagina',
    },
    {
      id: 'tubal-ostia',
      label: 'Tubal openings',
      group: 'Uterus and vagina',
    },
    {
      id: 'lower-segment',
      label: 'Lower uterine segment',
      group: 'Uterus and vagina',
    },
    {
      id: 'cervix',
      label: 'Cervix',
      group: 'Uterus and vagina',
    },
    {
      id: 'internal-os',
      label: 'Internal os',
      group: 'Uterus and vagina',
    },
    {
      id: 'external-os',
      label: 'External os',
      group: 'Uterus and vagina',
    },
    {
      id: 'vagina',
      label: 'Vagina',
      group: 'Uterus and vagina',
    },
    {
      id: 'cervicovaginal-junction',
      label: 'Cervicovaginal junction',
      group: 'Uterus and vagina',
    },
    {
      id: 'isthmus',
      label: 'Isthmus',
      group: 'Uterine tubes',
    },
    {
      id: 'ampulla',
      label: 'Ampulla',
      group: 'Uterine tubes',
    },
    {
      id: 'infundibulum',
      label: 'Infundibulum',
      group: 'Uterine tubes',
    },
    {
      id: 'fimbriae',
      label: 'Fimbriae',
      group: 'Uterine tubes',
    },
    {
      id: 'left-ovary',
      label: 'Left ovary',
      group: 'Ovaries',
    },
    {
      id: 'right-ovary',
      label: 'Right ovary',
      group: 'Ovaries',
    },
    {
      id: 'broad-ligament',
      label: 'Broad ligament',
      group: 'Ligaments',
    },
    {
      id: 'mesosalpinx',
      label: 'Mesosalpinx',
      group: 'Ligaments',
    },
    {
      id: 'mesovarium',
      label: 'Mesovarium',
      group: 'Ligaments',
    },
    {
      id: 'ovarian-ligaments',
      label: 'Ovarian ligaments',
      group: 'Ligaments',
    },
    {
      id: 'suspensory-ligaments',
      label: 'Suspensory ligaments of the ovary',
      group: 'Ligaments',
    },
    {
      id: 'round-ligaments',
      label: 'Round ligaments',
      group: 'Ligaments',
    },
    {
      id: 'cardinal-ligaments',
      label: 'Cardinal ligaments',
      group: 'Ligaments',
    },
    {
      id: 'uterosacral-ligaments',
      label: 'Uterosacral ligaments',
      group: 'Ligaments',
    },
    {
      id: 'uterine-arteries',
      label: 'Uterine arteries',
      group: 'Blood vessels',
    },
    {
      id: 'uterine-veins',
      label: 'Uterine veins',
      group: 'Blood vessels',
    },
    {
      id: 'bladder',
      label: 'Urinary bladder',
      group: 'Neighbouring structures',
    },
  ],
  vessels: [
    {
      id: 'carotid-arteries',
      label: 'Carotid arteries',
      group: 'Head and neck',
    },
    {
      id: 'vertebral-arteries',
      label: 'Vertebral arteries',
      group: 'Head and neck',
    },
    {
      id: 'jugular-veins',
      label: 'Jugular veins',
      group: 'Head and neck',
    },
    {
      id: 'ascending-aorta',
      label: 'Ascending aorta',
      group: 'Chest',
    },
    {
      id: 'aortic-arch',
      label: 'Aortic arch',
      group: 'Chest',
    },
    {
      id: 'descending-aorta',
      label: 'Descending aorta',
      group: 'Chest',
    },
    {
      id: 'brachiocephalic-trunk',
      label: 'Brachiocephalic trunk',
      group: 'Chest',
    },
    {
      id: 'internal-thoracic-arteries',
      label: 'Internal thoracic arteries',
      group: 'Chest',
    },
    {
      id: 'pulmonary-trunk',
      label: 'Pulmonary trunk',
      group: 'Chest',
    },
    {
      id: 'pulmonary-arteries',
      label: 'Pulmonary arteries',
      group: 'Chest',
    },
    {
      id: 'pulmonary-veins',
      label: 'Pulmonary veins',
      group: 'Chest',
    },
    {
      id: 'superior-vena-cava',
      label: 'Superior vena cava',
      group: 'Chest',
    },
    {
      id: 'brachiocephalic-veins',
      label: 'Brachiocephalic veins',
      group: 'Chest',
    },
    {
      id: 'azygos-system',
      label: 'Azygos system',
      group: 'Chest',
    },
    {
      id: 'subclavian-arteries',
      label: 'Subclavian arteries',
      group: 'Arms',
    },
    {
      id: 'axillary-arteries',
      label: 'Axillary arteries',
      group: 'Arms',
    },
    {
      id: 'brachial-arteries',
      label: 'Brachial arteries',
      group: 'Arms',
    },
    {
      id: 'radial-arteries',
      label: 'Radial arteries',
      group: 'Arms',
    },
    {
      id: 'ulnar-arteries',
      label: 'Ulnar arteries',
      group: 'Arms',
    },
    {
      id: 'palmar-arches',
      label: 'Deep palmar arches',
      group: 'Arms',
    },
    {
      id: 'subclavian-veins',
      label: 'Subclavian veins',
      group: 'Arms',
    },
    {
      id: 'axillary-veins',
      label: 'Axillary veins',
      group: 'Arms',
    },
    {
      id: 'cephalic-veins',
      label: 'Cephalic veins',
      group: 'Arms',
    },
    {
      id: 'basilic-veins',
      label: 'Basilic veins',
      group: 'Arms',
    },
    {
      id: 'celiac-trunk',
      label: 'Celiac trunk',
      group: 'Abdomen',
    },
    {
      id: 'hepatic-artery',
      label: 'Hepatic artery',
      group: 'Abdomen',
    },
    {
      id: 'splenic-artery',
      label: 'Splenic artery',
      group: 'Abdomen',
    },
    {
      id: 'superior-mesenteric-artery',
      label: 'Superior mesenteric artery',
      group: 'Abdomen',
    },
    {
      id: 'inferior-mesenteric-artery',
      label: 'Inferior mesenteric artery',
      group: 'Abdomen',
    },
    {
      id: 'renal-arteries',
      label: 'Renal arteries',
      group: 'Abdomen',
    },
    {
      id: 'inferior-vena-cava',
      label: 'Inferior vena cava',
      group: 'Abdomen',
    },
    {
      id: 'renal-veins',
      label: 'Renal veins',
      group: 'Abdomen',
    },
    {
      id: 'portal-vein',
      label: 'Portal vein',
      group: 'Abdomen',
    },
    {
      id: 'splenic-mesenteric-veins',
      label: 'Splenic and mesenteric veins',
      group: 'Abdomen',
    },
    {
      id: 'common-iliac-arteries',
      label: 'Common iliac arteries',
      group: 'Pelvis',
    },
    {
      id: 'internal-iliac-arteries',
      label: 'Internal iliac arteries',
      group: 'Pelvis',
    },
    {
      id: 'external-iliac-arteries',
      label: 'External iliac arteries',
      group: 'Pelvis',
    },
    {
      id: 'common-iliac-veins',
      label: 'Common iliac veins',
      group: 'Pelvis',
    },
    {
      id: 'internal-iliac-veins',
      label: 'Internal iliac veins',
      group: 'Pelvis',
    },
    {
      id: 'external-iliac-veins',
      label: 'External iliac veins',
      group: 'Pelvis',
    },
    {
      id: 'femoral-arteries',
      label: 'Femoral arteries',
      group: 'Legs',
    },
    {
      id: 'deep-femoral-arteries',
      label: 'Deep femoral arteries',
      group: 'Legs',
    },
    {
      id: 'popliteal-arteries',
      label: 'Popliteal arteries',
      group: 'Legs',
    },
    {
      id: 'anterior-tibial-arteries',
      label: 'Anterior tibial arteries',
      group: 'Legs',
    },
    {
      id: 'posterior-tibial-arteries',
      label: 'Posterior tibial arteries',
      group: 'Legs',
    },
    {
      id: 'fibular-arteries',
      label: 'Fibular arteries',
      group: 'Legs',
    },
    {
      id: 'foot-arteries',
      label: 'Foot arteries',
      group: 'Legs',
    },
    {
      id: 'femoral-veins',
      label: 'Femoral veins',
      group: 'Legs',
    },
    {
      id: 'popliteal-veins',
      label: 'Popliteal veins',
      group: 'Legs',
    },
    {
      id: 'great-saphenous-veins',
      label: 'Great saphenous veins',
      group: 'Legs',
    },
    {
      id: 'small-saphenous-veins',
      label: 'Small saphenous veins',
      group: 'Legs',
    },
  ],
  vestibular: [
    {
      id: 'anterior-canal',
      label: 'Anterior semicircular canal',
      group: 'Semicircular canals',
    },
    {
      id: 'posterior-canal',
      label: 'Posterior semicircular canal',
      group: 'Semicircular canals',
    },
    {
      id: 'lateral-canal',
      label: 'Lateral semicircular canal',
      group: 'Semicircular canals',
    },
    {
      id: 'vestibule',
      label: 'Vestibule',
      group: 'Vestibule',
    },
    {
      id: 'cochlea',
      label: 'Cochlea',
      group: 'Nearby structures',
    },
    {
      id: 'vestibular-nerve',
      label: 'Vestibular nerve',
      group: 'Nearby structures',
    },
  ],
};

/** Human label for an organ slug: 'spinal-cord' → 'Spinal cord'. */
export function organDisplayName(slug: string): string {
  const text = slug.replace(/[-_]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : slug;
}

/** Sorted organ slugs available in the catalogue. */
export const organKeys: string[] = Object.keys(organCatalog).sort();

import { createClient } from '@supabase/supabase-js';

const url = 'https://xmpbhxbckwkglxscnudf.supabase.co';
const anonKey = 'sb_publishable_drUEvJfXWNff1khOYuvgng_9XmYqKdY';

const supabase = createClient(url, anonKey);

async function test() {
  console.log('Testing insert into issues table...');

  // First sign up/in a user to be authenticated, since insert likely requires auth
  const email = 'test-insert-' + Math.random().toString(36).substring(7) + '@example.com';
  const password = 'Password123!';

  console.log(`Signing up user: ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  const userId = authData.user?.id;
  console.log('Auth success! User ID:', userId);

  // Payload without a photo
  const payload = {
    user_id: userId,
    title: 'Teste de Inserção Antigravity',
    description: 'Descrição de teste para validar o insert',
    category: 'Vias e Pavimentação',
    status: 'aberto',
    severity: 'medium',
    lat: -1.4558,
    lng: -48.4902,
    address: 'Rua de Teste, 123',
    neighborhood: 'Batista Campos',
    photo_url: null,
    anonymous: false
  };

  console.log('Inserting payload without photo...');
  const { data: insData, error: insError } = await supabase
    .from('issues')
    .insert(payload)
    .select('*');

  if (insError) {
    console.error('Insert without photo error:', insError.message, insError.details, insError.hint);
  } else {
    console.log('Insert without photo SUCCESS!', insData);
  }

  // Payload with a base64 photo
  const base64Photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const payloadWithPhoto = {
    ...payload,
    title: 'Teste com Foto Base64',
    photo_url: base64Photo
  };

  console.log('Inserting payload with small base64 photo...');
  const { data: insPhotoData, error: insPhotoError } = await supabase
    .from('issues')
    .insert(payloadWithPhoto)
    .select('*');

  if (insPhotoError) {
    console.error('Insert with photo error:', insPhotoError.message, insPhotoError.details, insPhotoError.hint);
  } else {
    console.log('Insert with photo SUCCESS!', insPhotoData);
  }
}

test();

-- Allow explicitly reviewed English profile content in the existing public snapshot.
-- This does not modify existing profile content, publication state, grants, or RLS.
alter table public.athar_profiles drop constraint athar_profiles_content_check;
alter table public.athar_profiles add constraint athar_profiles_content_check check (
 jsonb_typeof(content)='object'
 and octet_length(content::text)<=100000
 and (content-array['name','headline','work','goal','experiences','education','courses','skills','city','moment','momentDetail','theme','email','phone','layout','font','density','sectionOrder','english'])='{}'::jsonb
 and (
  not (content ? 'english')
  or (
   jsonb_typeof(content->'english')='object'
   and ((content->'english')-array['name','headline','work','goal','city','education','courses','skills','moment','momentDetail','experiences'])='{}'::jsonb
   and (not ((content->'english') ? 'experiences') or jsonb_typeof(content->'english'->'experiences')='array')
  )
 )
);
